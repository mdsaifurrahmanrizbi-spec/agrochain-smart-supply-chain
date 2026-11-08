
import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { pool } from './db.js';
import bcrypt from 'bcryptjs';
import { createAuthToken, requireAuth } from './auth.js';
import rupantorPayRouter from './rupantorpay.js';

const app = express();
const PORT = Number(process.env.PORT || 8000);

app.use(express.json({ limit: '1mb' }));

// Set CORS_ORIGINS to comma-separated deployed frontend origins in production.
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://bucolic-llama-369eaf.netlify.app',
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader(
  'Access-Control-Allow-Methods',
  'GET, POST, PUT, PATCH, DELETE, OPTIONS'
);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Admin-Bootstrap-Token'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use('/api/payment', rupantorPayRouter);

// Role directory used by the frontend health check and admin panel.
const roles = [
  { id: 'admin', name: 'Admin' },
  { id: 'farmer', name: 'Farmer / Seller' },
  { id: 'buyer', name: 'Customer / Buyer' },
  { id: 'delivery', name: 'Delivery Partner' },
  { id: 'warehouse', name: 'Warehouse Manager' },
  { id: 'inspector', name: 'Quality Inspector' },
];

app.get('/api/roles/', (req, res) => {
  res.json(roles);
});

const googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googleAllowedRoles = new Set(['farmer', 'buyer']);
const googleProfileTokenSecret = () => {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) throw new Error('JWT_SECRET is missing or too short');
  return secret;
};
function publicAuthUser(account) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    phone: account.phone || '',
    avatar: account.avatar || undefined,
    location: '',
    status: account.status,
    createdAt: account.created_at,
  };
}
function dashboardRoleIsAllowed(role) {
  return googleAllowedRoles.has(String(role || '').toLowerCase());
}

// Google ID token is verified server-side; never trust profile fields supplied by the browser.
app.post('/api/auth/google/', async (req, res) => {
  const credential = typeof req.body?.credential === 'string' ? req.body.credential : '';
  const requestedRole = typeof req.body?.requestedRole === 'string' ? req.body.requestedRole.trim().toLowerCase() : '';
  if (!credential || credential.length > 10000) return res.status(400).json({ message: 'Google credential is missing or invalid' });
  if (requestedRole && !googleAllowedRoles.has(requestedRole)) {
    return res.status(403).json({ message: 'Google sign-in is not available for this role. Please sign in with your email and password.' });
  }
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google sign-in is not configured on the server yet.' });

  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const validIssuer = payload?.iss === 'accounts.google.com' || payload?.iss === 'https://accounts.google.com';
    if (!payload || !payload.sub || !payload.email || payload.email_verified !== true ||
        !validIssuer || payload.aud !== process.env.GOOGLE_CLIENT_ID ||
        !payload.exp || payload.exp * 1000 <= Date.now()) {
      return res.status(401).json({ message: 'Google account email must be verified. Please try another account.' });
    }

    const googleId = payload.sub;
    const verifiedEmail = payload.email.trim().toLowerCase();
    const verifiedName = String(payload.name || verifiedEmail.split('@')[0]).trim().slice(0, 120);
    const avatar = typeof payload.picture === 'string' ? payload.picture.slice(0, 2048) : null;

    const byGoogle = await pool.query(
      'SELECT id, name, email, role, status, google_id, auth_provider, avatar, created_at FROM auth_users WHERE google_id = $1 LIMIT 1',
      [googleId]
    );
    let account = byGoogle.rows[0];
    if (account) {
      if (!dashboardRoleIsAllowed(account.role)) {
        return res.status(403).json({ message: 'Please sign in with your email and password.' });
      }
      if (account.status !== 'ACTIVE') return res.status(403).json({ message: 'This account is not active. Contact an administrator.' });
      const user = publicAuthUser(account);
      return res.json({ token: createAuthToken(user), user });
    }

    const byEmail = await pool.query(
      'SELECT id, name, email, role, status, google_id, auth_provider, avatar, created_at FROM auth_users WHERE LOWER(email) = $1 LIMIT 1',
      [verifiedEmail]
    );
    account = byEmail.rows[0];
    if (account) {
      if (!dashboardRoleIsAllowed(account.role)) {
        return res.status(403).json({ message: 'Please sign in with your email and password.' });
      }
      if (account.status !== 'ACTIVE') return res.status(403).json({ message: 'This account is not active. Contact an administrator.' });
      if (account.google_id && account.google_id !== googleId) {
        return res.status(409).json({ message: 'A different Google account is already linked to this email.' });
      }
      const linked = await pool.query(
        `UPDATE auth_users
         SET google_id = $1,
             auth_provider = CASE WHEN auth_provider = 'password' THEN 'password+google' ELSE auth_provider END,
             avatar = COALESCE($2, avatar)
         WHERE id = $3
         RETURNING id, name, email, role, status, google_id, auth_provider, avatar, created_at`,
        [googleId, avatar, account.id]
      );
      account = linked.rows[0];
      const user = publicAuthUser(account);
      return res.json({ token: createAuthToken(user), user });
    }

    // New users, regardless of whether they started on /login or /register, must choose an allowed role and phone.
    const profileToken = jwt.sign({
      purpose: 'google-profile-completion',
      googleId,
      email: verifiedEmail,
      name: verifiedName,
      avatar,
    }, googleProfileTokenSecret(), { expiresIn: '10m', issuer: 'agrochain-api', audience: 'agrochain-google-profile' });
    return res.json({ needsProfile: true, profileToken, name: verifiedName, email: verifiedEmail, avatar });
  } catch (error) {
    if (error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError' || /invalid token|token used too late|invalid jwt|signature|audience/i.test(String(error?.message || ''))) {
      return res.status(401).json({ message: 'Google sign-in expired or could not be verified. Please try again.' });
    }
    console.error('Google authentication failed:', error.message);
    return res.status(503).json({ message: 'Google sign-in could not be completed. Please try again.' });
  }
});

app.post('/api/auth/google/complete-profile/', async (req, res) => {
  const profileToken = typeof req.body?.profileToken === 'string' ? req.body.profileToken : '';
  const role = typeof req.body?.role === 'string' ? req.body.role.trim().toLowerCase() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  if (!profileToken) return res.status(400).json({ message: 'Google profile session is missing. Start Google sign-in again.' });
  if (!googleAllowedRoles.has(role)) return res.status(403).json({ message: 'Google accounts are only available for Farmer/Seller and Buyer/Customer.' });
  if (!/^\+8801[3-9]\d{8}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid Bangladesh mobile number (+8801XXXXXXXXX).' });

  try {
    const claims = jwt.verify(profileToken, googleProfileTokenSecret(), {
      issuer: 'agrochain-api',
      audience: 'agrochain-google-profile',
      algorithms: ['HS256'],
    });
    if (!claims || typeof claims !== 'object' || claims.purpose !== 'google-profile-completion' ||
        typeof claims.googleId !== 'string' || typeof claims.email !== 'string' ||
        typeof claims.name !== 'string') {
      return res.status(401).json({ message: 'Google profile session is invalid. Start again.' });
    }

    const existing = await pool.query(
      'SELECT id, role FROM auth_users WHERE LOWER(email) = $1 OR google_id = $2 LIMIT 1',
      [claims.email.toLowerCase(), claims.googleId]
    );
    if (existing.rowCount) {
      return res.status(409).json({ message: 'An account already exists for this Google email. Please sign in with Google again.' });
    }

    const crypto = await import('node:crypto');
    const id = 'usr_' + crypto.randomUUID();
    const created = await pool.query(
      `INSERT INTO auth_users (id, name, email, password_hash, role, status, google_id, auth_provider, avatar)
       VALUES ($1, $2, $3, NULL, $4, 'ACTIVE', $5, 'google', $6)
       RETURNING id, name, email, role, status, avatar, created_at`,
      [id, claims.name.slice(0, 120), claims.email.toLowerCase(), role, claims.googleId, typeof claims.avatar === 'string' ? claims.avatar : null]
    );
    const account = created.rows[0];
    const profile = { id, name: account.name, phone, location: '', avatar: account.avatar || '', authProvider: 'google', updatedAt: new Date().toISOString() };
    await pool.query(
      `INSERT INTO agrochain_records (resource, id, data, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW(), NOW())
       ON CONFLICT (resource, id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [role === 'farmer' ? 'farmerProfiles' : 'buyerProfiles', id, JSON.stringify(profile)]
    );
    const user = { ...publicAuthUser(account), phone, avatar: account.avatar || undefined };
    return res.status(201).json({ token: createAuthToken(user), user });
  } catch (error) {
    if (error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Google profile session expired. Start Google sign-in again.' });
    }
    if (error.code === '23505') return res.status(409).json({ message: 'An account already exists for this email or Google ID.' });
    console.error('Google profile completion failed:', error.message);
    return res.status(500).json({ message: 'Could not complete Google profile. Please try again.' });
  }
});


// Public registration: self-service roles only.
app.post('/api/register/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : '';
  const password = typeof req.body?.password === 'string'
    ? req.body.password
    : '';
  const requestedRole = typeof req.body?.role === 'string'
    ? req.body.role.trim().toLowerCase()
    : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim().slice(0, 32) : '';
  const location = typeof req.body?.location === 'string' ? req.body.location.trim().slice(0, 500) : '';

  const allowedRegistrationRoles = new Set(['farmer', 'buyer', 'delivery', 'warehouse']);

  if (!name || name.length > 120) {
    return res.status(400).json({ message: 'Name is required and must be at most 120 characters' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid email address' });
  }

  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be 12 to 128 characters long' });
  }

  if (!allowedRegistrationRoles.has(requestedRole)) {
    return res.status(400).json({ message: 'This role cannot be registered publicly' });
  }

  const deliveryProfile = req.body?.deliveryProfile && typeof req.body.deliveryProfile === 'object' ? req.body.deliveryProfile : null;
  const warehouseProfile = req.body?.warehouseProfile && typeof req.body.warehouseProfile === 'object' ? req.body.warehouseProfile : null;
  const validNid = value => typeof value === 'string' && /^(?:\d{10}|\d{13}|\d{17})$/.test(value.trim());

  if (requestedRole === 'delivery') {
    if (!deliveryProfile || !validNid(deliveryProfile.nid) || !deliveryProfile.address?.trim() ||
        !deliveryProfile.district?.trim() || !deliveryProfile.upazila?.trim() ||
        !Array.isArray(deliveryProfile.serviceDistricts) || deliveryProfile.serviceDistricts.length < 1 ||
        !Array.isArray(deliveryProfile.assignedAreas) || deliveryProfile.assignedAreas.length < 1 ||
        !deliveryProfile.vehicleRegNumber?.trim() ||
        (!deliveryProfile.canPickup && !deliveryProfile.canDeliver)) {
      return res.status(400).json({ message: 'Complete the NID, address, service districts/areas, vehicle registration and work-type fields.' });
    }
  }

  if (requestedRole === 'warehouse') {
    if (!warehouseProfile || !validNid(warehouseProfile.managerNid) || !warehouseProfile.name?.trim() ||
        !warehouseProfile.address?.trim() || !warehouseProfile.city?.trim() || !warehouseProfile.area?.trim() ||
        !Number.isFinite(Number(warehouseProfile.capacityMetricTons)) || Number(warehouseProfile.capacityMetricTons) < 1) {
      return res.status(400).json({ message: 'Complete the manager NID and all warehouse address/capacity fields.' });
    }
  }

  const status = ['delivery', 'warehouse'].includes(requestedRole) ? 'PENDING' : 'ACTIVE';

  try {
    const existing = await pool.query(
      'SELECT id FROM auth_users WHERE email = $1 AND role = $2',
      [email, requestedRole]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = 'usr_' + (await import('node:crypto')).randomUUID();

    const result = await pool.query(
      `INSERT INTO auth_users (id, name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, status, created_at`,
      [id, name, email, passwordHash, requestedRole, status]
    );

    const account = result.rows[0];

    if (requestedRole === 'delivery') {
      const partnerRecord = {
        id, userId: id, name, email, phone, status: 'PENDING_APPROVAL',
        nid: deliveryProfile.nid.trim(), district: deliveryProfile.district.trim(),
        upazila: deliveryProfile.upazila.trim(), permanentAddress: String(deliveryProfile.permanentAddress || '').trim(),
        address: deliveryProfile.address.trim(), preferredArea: String(deliveryProfile.preferredArea || '').trim(),
        serviceDistricts: deliveryProfile.serviceDistricts, assignedAreas: deliveryProfile.assignedAreas,
        vehicleType: deliveryProfile.vehicleType, vehicleRegNumber: deliveryProfile.vehicleRegNumber.trim(),
        canPickup: Boolean(deliveryProfile.canPickup), canDeliver: Boolean(deliveryProfile.canDeliver),
        createdAt: new Date().toISOString(),
      };
      await pool.query(
        "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('deliveryPartners', $1, $2::jsonb, NOW(), NOW())",
        [id, JSON.stringify(partnerRecord)]
      );
    } else if (requestedRole === 'warehouse') {
      const warehouseRecord = {
        id, userId: id, managerName: name, email, phone, status: 'PENDING_APPROVAL',
        managerNid: warehouseProfile.managerNid.trim(), name: warehouseProfile.name.trim(),
        type: warehouseProfile.type, address: warehouseProfile.address.trim(), city: warehouseProfile.city.trim(),
        area: warehouseProfile.area.trim(), capacityMetricTons: Number(warehouseProfile.capacityMetricTons),
        temperatureControlled: Boolean(warehouseProfile.temperatureControlled), createdAt: new Date().toISOString(),
      };
      await pool.query(
        "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('warehouseApplications', $1, $2::jsonb, NOW(), NOW())",
        [id, JSON.stringify(warehouseRecord)]
      );
    }

    return res.status(201).json({
      message: ['delivery', 'warehouse'].includes(requestedRole)
        ? `${requestedRole === 'delivery' ? 'Delivery Partner' : 'Warehouse'} application submitted. You can log in after an administrator approves your account.`
        : 'Account created successfully. You can now log in.',
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        status: account.status,
        createdAt: account.created_at,
      },
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    console.error('Registration failed:', error.message);
    return res.status(500).json({ message: 'Registration could not be completed' });
  }
});

// One-time first-admin bootstrap. Requires a secret configured in the hosting environment.
app.post('/api/admin/bootstrap/', async (req, res) => {
  const configuredToken = process.env.ADMIN_BOOTSTRAP_TOKEN || '';
  const suppliedToken = typeof req.headers['x-admin-bootstrap-token'] === 'string'
    ? req.headers['x-admin-bootstrap-token']
    : '';
  const configuredBytes = Buffer.from(configuredToken);
  const suppliedBytes = Buffer.from(suppliedToken);
  const crypto = await import('node:crypto');

  if (configuredBytes.length < 32 || suppliedBytes.length !== configuredBytes.length ||
      !crypto.timingSafeEqual(suppliedBytes, configuredBytes)) {
    return res.status(403).json({ message: 'Admin setup token is invalid or not configured' });
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name || name.length > 120) {
    return res.status(400).json({ message: 'Name is required and must be at most 120 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid email address' });
  }
  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be 12 to 128 characters long' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('agrochain_first_admin_bootstrap'))");
    const existingAdmin = await client.query("SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1");
    if (existingAdmin.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'An admin account already exists. Bootstrap is permanently closed.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = 'usr_' + crypto.randomUUID();
    const result = await client.query(
      `INSERT INTO auth_users (id, name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'admin', 'ACTIVE')
       RETURNING id, name, email, role, status, created_at`,
      [id, name, email, passwordHash]
    );
    await client.query('COMMIT');
    const account = result.rows[0];
    return res.status(201).json({
      message: 'Initial admin account created. You can now sign in.',
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        status: account.status,
        createdAt: account.created_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account already exists for this email and role' });
    }
    console.error('Admin bootstrap failed:', error.message);
    return res.status(500).json({ message: 'Admin account could not be created' });
  } finally {
    client.release();
  }
});

// Temporary admin recovery. Enable only during recovery, then disable the env flag.
app.post('/api/admin/recover-password/', async (req, res) => {
  if (process.env.ADMIN_RECOVERY_ENABLED !== 'true') {
    return res.status(404).json({ message: 'Admin recovery is disabled' });
  }

  const configuredToken = process.env.ADMIN_BOOTSTRAP_TOKEN || '';
  const suppliedToken = typeof req.headers['x-admin-bootstrap-token'] === 'string'
    ? req.headers['x-admin-bootstrap-token']
    : '';
  const crypto = await import('node:crypto');
  const configuredBytes = Buffer.from(configuredToken);
  const suppliedBytes = Buffer.from(suppliedToken);

  if (configuredBytes.length < 32 || suppliedBytes.length !== configuredBytes.length ||
      !crypto.timingSafeEqual(suppliedBytes, configuredBytes)) {
    return res.status(403).json({ message: 'Recovery token is invalid or not configured' });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid email address' });
  }
  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be 12 to 128 characters long' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "UPDATE auth_users SET password_hash = $1 WHERE email = $2 AND role = 'admin' RETURNING id",
      [passwordHash, email]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No admin account was found for that email' });
    }
    return res.json({ message: 'Admin password updated. Disable ADMIN_RECOVERY_ENABLED in hosting settings now, then sign in.' });
  } catch (error) {
    console.error('Admin password recovery failed:', error.message);
    return res.status(500).json({ message: 'Admin password could not be updated' });
  }
});

// Temporary creation of an additional admin. Enable only while creating the account, then disable the flag.
app.post('/api/admin/create-account/', async (req, res) => {
  if (process.env.ADMIN_ACCOUNT_CREATION_ENABLED !== 'true') {
    return res.status(404).json({ message: 'Admin account creation is disabled' });
  }

  const configuredToken = process.env.ADMIN_BOOTSTRAP_TOKEN || '';
  const suppliedToken = typeof req.headers['x-admin-bootstrap-token'] === 'string'
    ? req.headers['x-admin-bootstrap-token']
    : '';
  const crypto = await import('node:crypto');
  const configuredBytes = Buffer.from(configuredToken);
  const suppliedBytes = Buffer.from(suppliedToken);

  if (configuredBytes.length < 32 || suppliedBytes.length !== configuredBytes.length ||
      !crypto.timingSafeEqual(suppliedBytes, configuredBytes)) {
    return res.status(403).json({ message: 'Admin creation token is invalid or not configured' });
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name || name.length > 120) {
    return res.status(400).json({ message: 'Name is required and must be at most 120 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid email address' });
  }
  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be 12 to 128 characters long' });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM auth_users WHERE email = $1 AND role = 'admin' LIMIT 1",
      [email]
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: 'An admin account already exists for this email. Use a different email.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = 'usr_' + crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO auth_users (id, name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'admin', 'ACTIVE')
       RETURNING id, name, email, role, status, created_at`,
      [id, name, email, passwordHash]
    );
    const account = result.rows[0];
    return res.status(201).json({
      message: 'New admin account created. Disable ADMIN_ACCOUNT_CREATION_ENABLED in hosting settings now, then sign in.',
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        status: account.status,
        createdAt: account.created_at,
      },
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account already exists for this email and role' });
    }
    console.error('Admin account creation failed:', error.message);
    return res.status(500).json({ message: 'Admin account could not be created' });
  }
});

// Password reset uses short-lived, single-use tokens delivered by Resend.
// Configure RESEND_API_KEY and RESET_EMAIL_FROM in the backend environment.
const passwordResetRequests = new Map();
app.post('/api/password-reset/request/', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const role = typeof req.body?.role === 'string' ? req.body.role.trim().toLowerCase() : '';
  const validRoles = new Set(['admin', 'farmer', 'buyer', 'delivery', 'warehouse', 'inspector']);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !validRoles.has(role)) {
    return res.status(400).json({ message: 'Enter a valid email and account role' });
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESET_EMAIL_FROM || !process.env.FRONTEND_URL) {
    return res.status(503).json({ message: 'Password recovery email is not configured yet. Please contact the platform administrator.' });
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const previousRequest = passwordResetRequests.get(ip);
  if (previousRequest && now - previousRequest < 60_000) {
    return res.status(429).json({ message: 'Please wait a minute before requesting another reset email.' });
  }
  passwordResetRequests.set(ip, now);
  if (passwordResetRequests.size > 5000) {
    for (const [key, timestamp] of passwordResetRequests) {
      if (now - timestamp > 60_000) passwordResetRequests.delete(key);
    }
  }

  try {
    const accountResult = await pool.query(
      "SELECT id, name, email, role FROM auth_users WHERE email = $1 AND role = $2 AND status = 'ACTIVE' LIMIT 1",
      [email, role]
    );
    const account = accountResult.rows[0];
    if (account) {
      const crypto = await import('node:crypto');
      const rawToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await pool.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [account.id]
      );
      await pool.query(
        "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '30 minutes')",
        [crypto.randomUUID(), account.id, tokenHash]
      );

      const frontend = process.env.FRONTEND_URL.replace(/\/$/, '');
      const resetPath = account.role === 'admin' ? '/admin-portal/reset-password' : '/password-reset';
      const resetUrl = frontend + resetPath + '?token=' + encodeURIComponent(rawToken);
      const safeName = String(account.name).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESET_EMAIL_FROM,
          to: [account.email],
          subject: 'Reset your AgroChain password',
          html: '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a"><h2>Reset your AgroChain password</h2><p>Hello ' + safeName + ',</p><p>We received a request to reset the password for your ' + account.role + ' account.</p><p><a href="' + resetUrl + '" style="display:inline-block;padding:12px 18px;background:#047857;color:#fff;text-decoration:none;border-radius:8px">Reset password</a></p><p>This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p></div>',
        }),
      });
      if (!emailResponse.ok) {
        const errorBody = await emailResponse.text().catch(() => '');
        console.error('Password reset email delivery failed:', emailResponse.status, errorBody.slice(0, 300));
        await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1', [tokenHash]);
        passwordResetRequests.delete(ip);
        return res.status(503).json({ message: 'Reset email could not be sent. Please contact the platform administrator.' });
      }
    }
    return res.json({ message: 'If an active account matches those details, a password reset link will be sent shortly.' });
  } catch (error) {
    console.error('Password reset request failed:', error.message);
    passwordResetRequests.delete(ip);
    return res.status(500).json({ message: 'Password reset could not be requested. Please try again later.' });
  }
});

app.post('/api/password-reset/confirm/', async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!token || token.length > 200) return res.status(400).json({ message: 'Reset token is missing or invalid' });
  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be 12 to 128 characters long' });
  }

  try {
    const crypto = await import('node:crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'SELECT prt.id AS token_id, prt.user_id FROM password_reset_tokens prt JOIN auth_users u ON u.id = prt.user_id WHERE prt.token_hash = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW() AND u.status = $2 FOR UPDATE OF prt',
        [tokenHash, 'ACTIVE']
      );
      const reset = result.rows[0];
      if (!reset) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'This reset link is invalid, expired, or already used. Request a new one.' });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      await client.query('UPDATE auth_users SET password_hash = $1 WHERE id = $2', [passwordHash, reset.user_id]);
      await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [reset.user_id]);
      await client.query('COMMIT');
      return res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Password reset confirmation failed:', error.message);
    return res.status(500).json({ message: 'Password could not be reset. Please request a new link and try again.' });
  }
});

// Password-verified login. Demo accounts must be created explicitly.
app.post('/api/login/', async (req, res) => {
  const email = String(req.body?.email || req.body?.username || '')
    .trim()
    .toLowerCase();
  const password = typeof req.body?.password === 'string'
    ? req.body.password
    : '';
  const requestedRole = typeof req.body?.role === 'string'
    ? req.body.role.trim().toLowerCase()
    : '';

  if (!email || !password || !requestedRole) {
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  const validRoles = new Set(['admin', 'farmer', 'buyer', 'delivery', 'warehouse', 'inspector']);
  if (!validRoles.has(requestedRole)) {
    return res.status(400).json({ message: 'Select a valid account role' });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, role, status, payout_method, payout_account_number, payout_bank_name, created_at
       FROM auth_users WHERE email = $1 AND role = $2`,
      [email, requestedRole]
    );
    const account = result.rows[0];

    // Do not disclose whether an account exists until its password is verified.
    if (!account || !account.password_hash || !(await bcrypt.compare(password, account.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (account.role !== requestedRole) {
      return res.status(403).json({ message: 'This account is not registered for the selected role. Choose the correct role and try again.' });
    }
    if (account.status === 'PENDING') {
      return res.status(403).json({ message: 'Your account is awaiting administrator approval.' });
    }
    if (account.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'This account is not active. Contact an administrator.' });
    }

    const user = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      status: account.status,
      payoutMethod: account.payout_method || undefined,
      payoutAccountNumber: account.payout_account_number || undefined,
      payoutBankName: account.payout_bank_name || undefined,
      createdAt: account.created_at,
    };

    return res.json({ token: createAuthToken(user), user });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({ message: 'Login could not be completed' });
  }
});

// Admin-only account management for staff creation and delivery-partner approval.
app.get('/api/admin/users/', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, status, created_at
       FROM auth_users ORDER BY created_at DESC`
    );
    return res.json(result.rows.map((row) => ({ ...row, createdAt: row.created_at })));
  } catch (error) {
    console.error('Could not list accounts:', error.message);
    return res.status(500).json({ message: 'Could not load accounts' });
  }
});

app.post('/api/admin/users/', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const role = typeof req.body?.role === 'string' ? req.body.role.trim().toLowerCase() : '';
  if (!name || name.length > 120) return res.status(400).json({ message: 'Name is required and must be at most 120 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: 'Enter a valid email address' });
  if (password.length < 12 || password.length > 128) return res.status(400).json({ message: 'Password must be 12 to 128 characters long' });
  if (!['warehouse', 'inspector'].includes(role)) return res.status(400).json({ message: 'Only Warehouse and Inspector staff can be created here' });
  try {
    const id = 'usr_' + (await import('node:crypto')).randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO auth_users (id, name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       RETURNING id, name, email, role, status, created_at`,
      [id, name, email, passwordHash, role]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'An account with this email and role already exists' });
    console.error('Could not create staff account:', error.message);
    return res.status(500).json({ message: 'Could not create staff account' });
  }
});

app.patch('/api/admin/delivery-partners/:id/approval/', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const partnerId = String(req.params.id || '').trim();
  const status = String(req.body?.status || '').trim().toUpperCase();
  const approverName = String(req.body?.approverName || 'Authorized Officer').trim().slice(0, 120);
  const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim().slice(0, 2000) : '';
  if (!partnerId) return res.status(400).json({ message: 'Partner ID is required' });
  if (!['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING_APPROVAL'].includes(status)) {
    return res.status(400).json({ message: 'Invalid partner approval status' });
  }
  const accountStatus = status === 'APPROVED' ? 'ACTIVE' : status === 'PENDING_APPROVAL' ? 'PENDING' : 'SUSPENDED';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const profileResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'deliveryPartners' AND id = $1 FOR UPDATE",
      [partnerId]
    );
    const profileRow = profileResult.rows[0];
    if (!profileRow) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Delivery partner profile not found' });
    }
    const profile = profileRow.data || {};
    const linkedUserId = typeof profile.userId === 'string' ? profile.userId.trim() : '';
    if (!linkedUserId) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'This profile is not linked to a login account. Approval was not changed.' });
    }
    if (linkedUserId === req.auth.sub) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'You cannot change your own account status' });
    }
    const accountResult = await client.query(
      "UPDATE auth_users SET status = $1 WHERE id = $2 AND role = 'delivery' RETURNING id, name, email, role, status",
      [accountStatus, linkedUserId]
    );
    if (!accountResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Linked delivery login account was not found. Approval was not changed.' });
    }
    const now = new Date().toISOString().slice(0, 10);
    const updatedProfile = {
      ...profile,
      approvalStatus: status,
      status,
      approvedBy: `${approverName} (Admin)`,
      approvalDate: now,
      approverRole: 'ADMIN',
      ...(notes ? { approvalNotes: notes } : {}),
    };
    const saved = await client.query(
      "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'deliveryPartners' AND id = $1 RETURNING id, data, created_at, updated_at",
      [partnerId, JSON.stringify(updatedProfile)]
    );
    await client.query('COMMIT');
    return res.json({ partner: saved.rows[0], account: accountResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Atomic delivery partner approval failed:', error.message);
    return res.status(500).json({ message: 'Delivery partner approval could not be completed' });
  } finally {
    client.release();
  }
});

// Admin-only Warehouse Manager application review. Account activation and application
// status are committed together so a failed review cannot leave a half-approved account.
app.get('/api/admin/warehouse-applications/', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  try {
    const result = await pool.query(
      `SELECT id, data, created_at, updated_at
       FROM agrochain_records
       WHERE resource = 'warehouseApplications'
       ORDER BY created_at DESC`
    );
    return res.json(result.rows.map((row) => ({
      ...(row.data || {}),
      id: row.id,
      createdAt: row.data?.createdAt || row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Could not load warehouse applications:', error.message);
    return res.status(500).json({ message: 'Could not load warehouse applications' });
  }
});

// Admin-only, read-only preview of approved and active managers missing a facility.
app.get('/api/admin/warehouse-facility-repair/preview/', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  try {
    const result = await pool.query(`
      SELECT a.id AS application_id, a.data AS application,
             u.id AS manager_id, u.name AS account_name, u.email AS account_email, u.status AS account_status
      FROM agrochain_records a
      JOIN auth_users u
        ON u.id = COALESCE(NULLIF(a.data->>'userId', ''), a.id)
       AND u.role = 'warehouse' AND UPPER(u.status) = 'ACTIVE'
      WHERE a.resource = 'warehouseApplications'
        AND UPPER(COALESCE(NULLIF(a.data->>'status', ''), a.data->>'approvalStatus', '')) = 'APPROVED'
        AND NOT EXISTS (
          SELECT 1 FROM agrochain_records w
          WHERE w.resource = 'warehouses'
            AND (w.data->>'managerId' = u.id OR w.data->>'applicationId' = a.id)
        )
      ORDER BY a.created_at ASC
    `);
    return res.set('Cache-Control', 'no-store').json({
      candidates: result.rows.map(row => ({
        applicationId: row.application_id,
        managerId: row.manager_id,
        managerName: row.application?.managerName || row.account_name,
        email: row.account_email,
        facilityName: row.application?.name || 'Warehouse',
        type: row.application?.type || 'REGIONAL_GODOWN',
        city: row.application?.city || '',
        area: row.application?.area || '',
        status: 'APPROVED',
        accountStatus: row.account_status,
      })),
      count: result.rowCount,
    });
  } catch (error) {
    console.error('Warehouse facility repair preview failed:', error.message);
    return res.status(500).json({ message: 'Could not preview missing warehouse facilities' });
  }
});

// Explicit Admin action. Idempotent and transactional: only approved applications
// with an ACTIVE warehouse account and no existing linked facility are repaired.
app.post('/api/admin/warehouse-facility-repair/run/', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  if (req.body?.confirm !== true) {
    return res.status(400).json({ message: 'Explicit confirmation is required to create missing facility records' });
  }
  const client = await pool.connect();
  let created = 0;
  let skipped = 0;
  const repaired = [];
  try {
    await client.query('BEGIN');
    const applications = await client.query(
      `SELECT id, data FROM agrochain_records
       WHERE resource = 'warehouseApplications'
         AND UPPER(COALESCE(NULLIF(data->>'status', ''), data->>'approvalStatus', '')) = 'APPROVED'
       ORDER BY created_at ASC
       FOR UPDATE`
    );
    for (const row of applications.rows) {
      const application = row.data || {};
      const managerId = String(application.userId || row.id).trim();
      if (!managerId) { skipped += 1; continue; }
      const account = await client.query(
        "SELECT id, name, status FROM auth_users WHERE id = $1 AND role = 'warehouse' FOR UPDATE",
        [managerId]
      );
      if (!account.rowCount || String(account.rows[0].status).toUpperCase() !== 'ACTIVE') {
        skipped += 1;
        continue;
      }
      const existing = await client.query(
        "SELECT id FROM agrochain_records WHERE resource = 'warehouses' AND (data->>'managerId' = $1 OR data->>'applicationId' = $2) LIMIT 1 FOR UPDATE",
        [managerId, row.id]
      );
      if (existing.rowCount) {
        if (application.warehouseId !== existing.rows[0].id) {
          await client.query(
            "UPDATE agrochain_records SET data = jsonb_set(data, '{warehouseId}', to_jsonb($2::text), true), updated_at = NOW() WHERE resource = 'warehouseApplications' AND id = $1",
            [row.id, existing.rows[0].id]
          );
        }
        skipped += 1;
        continue;
      }
      const crypto = await import('node:crypto');
      const warehouseId = 'wh_' + crypto.randomUUID();
      const now = new Date().toISOString();
      const prefix = String(application.city || application.area || 'WH')
        .replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5) || 'WH';
      const facility = {
        id: warehouseId,
        applicationId: row.id,
        name: String(application.name || 'Warehouse').trim(),
        code: `${prefix}-${warehouseId.slice(-6).toUpperCase()}`,
        type: application.type === 'CENTRAL' ? 'CENTRAL' : 'REGIONAL_GODOWN',
        location: [application.area, application.city].filter(Boolean).join(', '),
        address: application.address || '',
        city: application.city || '',
        area: application.area || '',
        managerName: application.managerName || account.rows[0].name,
        managerId,
        capacityMetricTons: Number(application.capacityMetricTons) || 0,
        currentStockMetricTons: 0,
        temperatureControlled: Boolean(application.temperatureControlled),
        createdAt: now,
      };
      await client.query(
        "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('warehouses', $1, $2::jsonb, NOW(), NOW())",
        [warehouseId, JSON.stringify(facility)]
      );
      await client.query(
        "UPDATE agrochain_records SET data = jsonb_set(data, '{warehouseId}', to_jsonb($2::text), true), updated_at = NOW() WHERE resource = 'warehouseApplications' AND id = $1",
        [row.id, warehouseId]
      );
      created += 1;
      repaired.push({ applicationId: row.id, warehouseId, name: facility.name, managerName: facility.managerName });
    }
    await client.query('COMMIT');
    return res.json({ message: 'Warehouse facility repair completed', created, skipped, repaired });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Warehouse facility repair failed:', error.message);
    return res.status(500).json({ message: 'Warehouse facility repair failed; no partial changes were committed' });
  } finally {
    client.release();
  }
});

// Admin-only correction for a warehouse facility's physical location.
// The linked application is updated in the same transaction to keep both records consistent.
app.patch('/api/admin/warehouses/:id/location/', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

  const warehouseId = String(req.params.id || '').trim();
  const area = typeof req.body?.area === 'string' ? req.body.area.trim() : '';
  const city = typeof req.body?.city === 'string' ? req.body.city.trim() : '';
  const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
  if (!warehouseId || !area || !city || !address ||
      area.length > 120 || city.length > 120 || address.length > 500) {
    return res.status(400).json({ message: 'Area, city/district, and full address are required and must be within the allowed length.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'warehouses' AND id = $1 FOR UPDATE",
      [warehouseId]
    );
    if (!found.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Warehouse facility not found' });
    }

    const current = found.rows[0].data || {};
    const updated = {
      ...current,
      area,
      city,
      address,
      location: [area, city].filter(Boolean).join(', '),
      updatedAt: new Date().toISOString(),
    };
    const saved = await client.query(
      "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'warehouses' AND id = $1 RETURNING id, data",
      [warehouseId, JSON.stringify(updated)]
    );

    if (current.applicationId) {
      await client.query(
        "UPDATE agrochain_records SET data = jsonb_set(jsonb_set(jsonb_set(data, '{area}', to_jsonb($2::text), true), '{city}', to_jsonb($3::text), true), '{address}', to_jsonb($4::text), true), updated_at = NOW() WHERE resource = 'warehouseApplications' AND id = $1",
        [current.applicationId, area, city, address]
      );
    }

    await client.query('COMMIT');
    return res.json({ warehouse: { ...saved.rows[0].data, id: saved.rows[0].id } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Warehouse location update failed:', error.message);
    return res.status(500).json({ message: 'Warehouse location could not be updated; no partial changes were committed.' });
  } finally {
    client.release();
  }
});

app.patch('/api/admin/warehouse-applications/:id/approval/', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const applicationId = String(req.params.id || '').trim();
  const decision = String(req.body?.status || '').trim().toUpperCase();
  const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim().slice(0, 2000) : '';
  if (!applicationId) return res.status(400).json({ message: 'Warehouse application ID is required' });
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ message: 'Choose APPROVED or REJECTED' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const applicationResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'warehouseApplications' AND id = $1 FOR UPDATE",
      [applicationId]
    );
    const applicationRow = applicationResult.rows[0];
    if (!applicationRow) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Warehouse application not found' });
    }
    const application = applicationRow.data || {};
    if (application.status === 'APPROVED' || application.status === 'REJECTED') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'This warehouse application has already been reviewed' });
    }
    const linkedUserId = String(application.userId || application.id || '').trim();
    const accountResult = await client.query(
      "UPDATE auth_users SET status = $1 WHERE id = $2 AND role = 'warehouse' RETURNING id, name, email, role, status, created_at",
      [decision === 'APPROVED' ? 'ACTIVE' : 'SUSPENDED', linkedUserId]
    );
    if (!accountResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'The linked Warehouse Manager account was not found. No changes were made.' });
    }

    const reviewedAt = new Date().toISOString();
    let createdWarehouse = null;
    if (decision === 'APPROVED') {
      const existingWarehouse = await client.query(
        "SELECT id, data FROM agrochain_records WHERE resource = 'warehouses' AND (data->>'managerId' = $1 OR data->>'applicationId' = $2) LIMIT 1 FOR UPDATE",
        [linkedUserId, applicationId]
      );
      if (existingWarehouse.rows[0]) {
        createdWarehouse = { ...existingWarehouse.rows[0].data, id: existingWarehouse.rows[0].id };
      } else {
        const crypto = await import('node:crypto');
        const warehouseId = 'wh_' + crypto.randomUUID();
        const prefix = String(application.city || application.area || 'WH').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5) || 'WH';
        const warehouseData = {
          id: warehouseId, applicationId, name: String(application.name || 'Warehouse').trim(),
          code: `${prefix}-${warehouseId.slice(-6).toUpperCase()}`,
          type: application.type === 'CENTRAL' ? 'CENTRAL' : 'REGIONAL_GODOWN',
          location: [application.area, application.city].filter(Boolean).join(', '),
          address: application.address || '', city: application.city || '', area: application.area || '',
          managerName: application.managerName || accountResult.rows[0].name, managerId: linkedUserId,
          capacityMetricTons: Number(application.capacityMetricTons) || 0,
          currentStockMetricTons: 0, temperatureControlled: Boolean(application.temperatureControlled),
          createdAt: reviewedAt,
        };
        const inserted = await client.query(
          "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('warehouses', $1, $2::jsonb, NOW(), NOW()) RETURNING id, data",
          [warehouseId, JSON.stringify(warehouseData)]
        );
        createdWarehouse = { ...inserted.rows[0].data, id: inserted.rows[0].id };
      }
    }
    const reviewedApplication = {
      ...application, status: decision, approvalStatus: decision,
      approvedBy: decision === 'APPROVED' ? 'Admin' : undefined,
      reviewedBy: 'Admin', reviewedAt,
      ...(notes ? { approvalNotes: notes } : {}),
      ...(createdWarehouse ? { warehouseId: createdWarehouse.id } : {}),
    };
    const saved = await client.query(
      "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'warehouseApplications' AND id = $1 RETURNING id, data, updated_at",
      [applicationId, JSON.stringify(reviewedApplication)]
    );
    await client.query('COMMIT');
    return res.json({
      application: { ...saved.rows[0].data, id: saved.rows[0].id, updatedAt: saved.rows[0].updated_at },
      account: { ...accountResult.rows[0], createdAt: accountResult.rows[0].created_at },
      warehouse: createdWarehouse,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Warehouse application review failed:', error.message);
    return res.status(500).json({ message: 'Warehouse application review could not be completed' });
  } finally {
    client.release();
  }
});

app.patch('/api/admin/users/:id/status/', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const status = typeof req.body?.status === 'string' ? req.body.status.trim().toUpperCase() : '';
  if (!['ACTIVE', 'PENDING', 'SUSPENDED'].includes(status)) return res.status(400).json({ message: 'Invalid account status' });
  if (req.params.id === req.auth.sub) return res.status(400).json({ message: 'You cannot change your own account status' });
  try {
    const result = await pool.query(
      `UPDATE auth_users SET status = $1 WHERE id = $2 AND role <> 'admin'
       RETURNING id, name, email, role, status, created_at`,
      [status, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Non-admin account not found' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Could not update account status:', error.message);
    return res.status(500).json({ message: 'Could not update account status' });
  }
});

// Farmer payout accounts are private: farmers may edit only their own account;
// only Admin and Warehouse Manager can view account details for payout processing.
app.patch('/api/farmer/payout-account/', requireAuth, async (req, res) => {
  if (req.auth.role !== 'farmer') return res.status(403).json({ message: 'Only farmers can update their own payout account' });
  const payoutMethod = typeof req.body?.payoutMethod === 'string' ? req.body.payoutMethod.trim() : '';
  const payoutAccountNumber = typeof req.body?.payoutAccountNumber === 'string' ? req.body.payoutAccountNumber.trim() : '';
  const payoutBankName = typeof req.body?.payoutBankName === 'string' ? req.body.payoutBankName.trim() : '';
  if (!['bKash', 'Nagad', 'Bank Transfer'].includes(payoutMethod)) return res.status(400).json({ message: 'Choose bKash, Nagad, or Bank Transfer' });
  if (payoutAccountNumber.length < 5 || payoutAccountNumber.length > 50) return res.status(400).json({ message: 'Enter a valid payout account number' });
  if (payoutBankName.length > 120) return res.status(400).json({ message: 'Bank name is too long' });
  try {
    const result = await pool.query(
      `UPDATE auth_users
       SET payout_method = $1, payout_account_number = $2, payout_bank_name = $3
       WHERE id = $4 AND role = 'farmer'
       RETURNING id, name, email, role, status, payout_method, payout_account_number, payout_bank_name, created_at`,
      [payoutMethod, payoutAccountNumber, payoutBankName || null, req.auth.sub]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Farmer account not found' });
    const row = result.rows[0];
    return res.json({ id: row.id, name: row.name, email: row.email, role: row.role, status: row.status, payoutMethod: row.payout_method, payoutAccountNumber: row.payout_account_number, payoutBankName: row.payout_bank_name, createdAt: row.created_at });
  } catch (error) {
    console.error('Could not save farmer payout account:', error.message);
    return res.status(500).json({ message: 'Could not save payout account' });
  }
});

app.get('/api/farmers/payout-accounts/', requireAuth, async (req, res) => {
  if (!['admin', 'warehouse'].includes(req.auth.role)) return res.status(403).json({ message: 'Admin or Warehouse Manager access required' });
  const requestedIds = typeof req.query.farmerIds === 'string'
    ? req.query.farmerIds.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 100)
    : [];
  try {
    const result = requestedIds.length
      ? await pool.query(
          `SELECT id, name, payout_method, payout_account_number, payout_bank_name
           FROM auth_users WHERE role = 'farmer' AND id = ANY($1::text[]) ORDER BY name`,
          [requestedIds]
        )
      : await pool.query(
          `SELECT id, name, payout_method, payout_account_number, payout_bank_name
           FROM auth_users WHERE role = 'farmer' ORDER BY name`
        );
    return res.json(result.rows.map((row) => ({
      farmerId: row.id,
      farmerName: row.name,
      payoutMethod: row.payout_method || null,
      payoutAccountNumber: row.payout_account_number || null,
      payoutBankName: row.payout_bank_name || null,
    })));
  } catch (error) {
    console.error('Could not load farmer payout accounts:', error.message);
    return res.status(500).json({ message: 'Could not load payout accounts' });
  }
});


function profilePayload(record) { return record?.data && typeof record.data === 'object' ? record.data : {}; }
app.get('/api/me/profile/', requireAuth, async (req, res) => {
  try { const result = await pool.query("SELECT data FROM agrochain_records WHERE resource = 'buyerProfiles' AND id = $1 LIMIT 1", [req.auth.sub]); return res.json(profilePayload(result.rows[0])); }
  catch (error) { console.error('Could not load profile:', error.message); return res.status(500).json({ message: 'Could not load profile' }); }
});
app.put('/api/me/profile/', requireAuth, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim().slice(0, 32) : '';
  const location = typeof req.body?.location === 'string' ? req.body.location.trim().slice(0, 500) : '';
  if (!name || name.length > 120) return res.status(400).json({ message: 'Enter a valid full name' });
  if (!phone || phone.length < 5) return res.status(400).json({ message: 'Enter a valid phone number' });
  if (!location) return res.status(400).json({ message: 'Enter your primary residence or delivery area' });
  try {
    const existing = await pool.query("SELECT data FROM agrochain_records WHERE resource = 'buyerProfiles' AND id = $1 LIMIT 1", [req.auth.sub]);
    const next = { ...profilePayload(existing.rows[0]), id: req.auth.sub, name, phone, location, updatedAt: new Date().toISOString() };
    await pool.query(`INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('buyerProfiles', $1, $2::jsonb, NOW(), NOW()) ON CONFLICT (resource, id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`, [req.auth.sub, JSON.stringify(next)]);
    return res.json(next);
  } catch (error) { console.error('Could not save profile:', error.message); return res.status(500).json({ message: 'Could not save profile changes' }); }
});
app.get('/api/me/addresses/', requireAuth, async (req, res) => {
  try { const result = await pool.query("SELECT data FROM agrochain_records WHERE resource = 'buyerAddresses' AND id = $1 LIMIT 1", [req.auth.sub]); const data = profilePayload(result.rows[0]); return res.json(Array.isArray(data.addresses) ? data.addresses : []); }
  catch (error) { console.error('Could not load delivery addresses:', error.message); return res.status(500).json({ message: 'Could not load delivery addresses' }); }
});
app.put('/api/me/addresses/', requireAuth, async (req, res) => {
  const addresses = req.body?.addresses;
  if (!Array.isArray(addresses) || addresses.length > 50) return res.status(400).json({ message: 'Addresses must be a list of at most 50 entries' });
  const ids = new Set();
  for (const item of addresses) {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) || typeof item.label !== 'string' || typeof item.recipient !== 'string' || typeof item.phone !== 'string' || typeof item.address !== 'string' || typeof item.area !== 'string' || typeof item.district !== 'string' || !item.recipient.trim() || !item.phone.trim() || !item.address.trim() || !item.area.trim() || !item.district.trim()) return res.status(400).json({ message: 'Every address must include a unique ID, recipient, phone, street address, area, and district' });
    ids.add(item.id);
  }
  if (addresses.length && addresses.filter((item) => item.isDefault === true).length !== 1) return res.status(400).json({ message: 'Choose exactly one default delivery address' });
  try {
    const data = { id: req.auth.sub, addresses, updatedAt: new Date().toISOString() };
    await pool.query(`INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('buyerAddresses', $1, $2::jsonb, NOW(), NOW()) ON CONFLICT (resource, id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`, [req.auth.sub, JSON.stringify(data)]);
    return res.json(addresses);
  } catch (error) { console.error('Could not save delivery addresses:', error.message); return res.status(500).json({ message: 'Could not save delivery addresses' }); }
});
// Return the authenticated account from the database.
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, status, payout_method, payout_account_number, payout_bank_name, created_at FROM auth_users WHERE id = $1', [req.auth.sub]);
    const account = result.rows[0];
    if (!account || account.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Account is inactive or unavailable' });
    }
    const managed = account.role === 'warehouse'
      ? await pool.query("SELECT id FROM agrochain_records WHERE resource = 'warehouses' AND data->>'managerId' = $1", [account.id])
      : { rows: [] };
    return res.json({
      id: account.id, name: account.name, email: account.email, role: account.role,
      status: account.status, createdAt: account.created_at,
      ...(account.role === 'warehouse' ? { isWarehouseManager: true, managedWarehouseIds: managed.rows.map((row) => row.id) } : {}),
    });
  } catch (error) {
    console.error('Current-user lookup failed:', error.message);
    return res.status(503).json({ message: 'Could not verify current account' });
  }
});
 
// Resolve the authenticated delivery account to its single persisted partner profile.
// This avoids client-side list matching and keeps identity/approval authoritative.
app.get('/api/delivery/me', requireAuth, async (req, res) => {
  if (req.auth.role !== 'delivery') {
    return res.status(403).json({ message: 'Only delivery partner accounts can access this profile' });
  }
  try {
    const accountResult = await pool.query(
      "SELECT id, email, status FROM auth_users WHERE id = $1 AND role = 'delivery' LIMIT 1",
      [req.auth.sub]
    );
    const account = accountResult.rows[0];
    if (!account || account.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Delivery account is inactive or unavailable' });
    }

    const partnerResult = await pool.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'deliveryPartners' AND (data->>'userId' = $1 OR id = $1 OR lower(data->>'email') = lower($2)) ORDER BY CASE WHEN data->>'userId' = $1 THEN 0 WHEN id = $1 THEN 1 ELSE 2 END LIMIT 1",
      [req.auth.sub, account.email]
    );
    const row = partnerResult.rows[0];
    if (!row || !row.data) {
      return res.status(404).json({ message: 'No delivery-partner profile is linked to this account' });
    }

    return res.set('Cache-Control', 'no-store').json({
      partner: {
        ...row.data,
        id: row.id,
        userId: req.auth.sub,
        accountStatus: account.status,
      },
    });
  } catch (error) {
    console.error('Current delivery-partner profile lookup failed:', error.message);
    return res.status(503).json({ message: 'Could not verify delivery-partner profile' });
  }
});

// Create the farm pickup assignment as soon as an order is confirmed.
// QC is intentionally not a prerequisite for assignment: the assigned partner
// must accept first, travel to the farm, perform QC, and only then collect.
// Resolve the first-mile receiving facility from the farm origin, never from the buyer's destination.
async function resolveOriginWarehouseForOrder(db, order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return null;

  const warehousesResult = await db.query(
    "SELECT id, data FROM agrochain_records WHERE resource = 'warehouses'"
  );
  const warehouses = warehousesResult.rows;
  if (!warehouses.length) return null;

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  const origins = [];
  for (const item of items) {
    const productResult = item.productId
      ? await db.query("SELECT data FROM agrochain_records WHERE resource = 'products' AND id = $1 LIMIT 1", [String(item.productId)])
      : { rows: [] };
    const product = productResult.rows[0]?.data || {};
    const farmResult = item.farmerId
      ? await db.query("SELECT data FROM agrochain_records WHERE resource = 'farms' AND data->>'farmerId' = $1 ORDER BY created_at ASC LIMIT 1", [String(item.farmerId)])
      : { rows: [] };
    const farm = farmResult.rows[0]?.data || {};
    const origin = normalize(
      product.farmLocation || product.farmAddress ||
      farm.location || farm.address ||
      [farm.area, farm.upazila, farm.city, farm.district].filter(Boolean).join(' ') ||
      item.farmLocation
    );
    if (!origin) return null;
    origins.push(origin);
  }

  const matches = warehouses.filter(({ data }) => {
    const city = normalize(data?.city);
    const area = normalize(data?.area);
    const location = normalize(data?.location);
    const facilityTerms = [city, area].filter(Boolean);
    if (!facilityTerms.length) return false;
    // Require the district/city and, when configured, the local area to match.
    return facilityTerms.every((term) => originContainsTerm(origins, term)) ||
      (facilityTerms.length === 1 && location && origins.every((origin) => origin.includes(location)));
  });

  if (matches.length !== 1) return null;
  return { id: matches[0].id, data: matches[0].data };
}

function originContainsTerm(origins, term) {
  return origins.every((origin) => origin.includes(term));
}

app.post('/api/orders/:orderId/assign-pickup', requireAuth, async (req, res) => {
  if (req.auth.role !== 'buyer') {
    return res.status(403).json({ message: 'Only the customer who placed the order can request its pickup assignment' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'orders' AND id = $1 FOR UPDATE",
      [req.params.orderId]
    );
    const orderRow = orderResult.rows[0];
    const order = orderRow?.data;
    if (!order || String(order.buyerId || '') !== String(req.auth.sub)) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found for this customer account' });
    }

    const originWarehouse = await resolveOriginWarehouseForOrder(client, order);
    if (!originWarehouse) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Could not identify one active origin warehouse for all products in this order. Verify each farm origin and its regional warehouse before pickup assignment.' });
    }
    order.warehouseId = originWarehouse.id;
    order.warehouseName = originWarehouse.data.name;
    order.originWarehouseId = originWarehouse.id;
    order.originWarehouseName = originWarehouse.data.name;

    const existingResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'jobs' AND data->>'orderId' = $1 AND data->>'type' = 'PICKUP' LIMIT 1",
      [orderRow.id]
    );
    if (existingResult.rows[0]) {
      const existingJob = { ...existingResult.rows[0].data, id: existingResult.rows[0].id, destinationAddress: originWarehouse.data.name };
      await client.query(
        "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'orders' AND id = $1",
        [orderRow.id, JSON.stringify(order)]
      );
      await client.query(
        "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'jobs' AND id = $1",
        [existingJob.id, JSON.stringify(existingJob)]
      );
      await client.query('COMMIT');
      return res.json({ job: existingJob });
    }

    const firstItem = Array.isArray(order.items) ? order.items[0] : null;
    const productId = String(firstItem?.productId || '');
    const productResult = productId
      ? await client.query("SELECT data FROM agrochain_records WHERE resource = 'products' AND id = $1 LIMIT 1", [productId])
      : { rows: [] };
    const product = productResult.rows[0]?.data || {};
    const farmResult = firstItem?.farmerId
      ? await client.query("SELECT data FROM agrochain_records WHERE resource = 'farms' AND data->>'farmerId' = $1 ORDER BY created_at ASC LIMIT 1", [String(firstItem.farmerId)])
      : { rows: [] };
    const farm = farmResult.rows[0]?.data || {};
    const originAddress = String(product.farmLocation || product.farmAddress || farm.location || farm.address || firstItem?.farmLocation || '').trim();
    const normalizeArea = (value) => String(value || '').normalize('NFC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
    const origin = normalizeArea(originAddress);

    const partnersResult = await client.query(
      "SELECT dp.id, dp.data FROM agrochain_records dp JOIN auth_users au ON au.role = 'delivery' AND au.status = 'ACTIVE' AND (au.id = dp.id OR au.id = dp.data->>'userId' OR lower(au.email) = lower(dp.data->>'email')) WHERE dp.resource = 'deliveryPartners'"
    );
    const eligible = partnersResult.rows.filter(({ data }) => {
      if (String(data?.approvalStatus || '').toUpperCase() !== 'APPROVED' || data?.canPickup !== true) return false;
      if (!origin || origin.includes('pending verification')) return false;
      const areas = [
        ...(Array.isArray(data.serviceDistricts) ? data.serviceDistricts : []),
        ...(Array.isArray(data.assignedAreas) ? data.assignedAreas : []),
        data.preferredArea || '',
        data.district || '',
        data.upazila || '',
      ].map(normalizeArea).filter(Boolean);
      return areas.some((area) => ` ${origin} `.includes(` ${area} `));
    });

    if (!eligible.length) {
      await client.query('COMMIT');
      return res.status(409).json({ message: 'No approved pickup partner currently serves this farm area. The order is confirmed and awaits dispatch assignment.' });
    }

    const partnerRows = await Promise.all(eligible.map(async (candidate) => {
      const active = await client.query(
        "SELECT COUNT(*)::int AS count FROM agrochain_records WHERE resource = 'jobs' AND data->>'partnerId' = $1 AND data->>'status' NOT IN ('DELIVERED', 'WAREHOUSE_HANDOVER', 'FAILED')",
        [candidate.id]
      );
      return { ...candidate, activeCount: Number(active.rows[0]?.count || 0) };
    }));
    partnerRows.sort((a, b) => a.activeCount - b.activeCount || Number(b.data.rating || 0) - Number(a.data.rating || 0));
    const partner = partnerRows[0];

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const jobId = `job-pkp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const job = {
      id: jobId,
      jobCode: `JOB-PKP-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: orderRow.id,
      orderNumber: order.orderNumber,
      partnerId: partner.id,
      partnerName: partner.data.name || partner.data.partnerName || 'Assigned Delivery Partner',
      type: 'PICKUP',
      productSummary: (order.items || []).map((item) => `${item.quantity} ${item.unit} ${item.productName}`).join(', '),
      originAddress: originAddress || 'Farm location pending verification',
      destinationAddress: originWarehouse.data.name,
      assignedDate: now,
      status: 'ASSIGNED',
      codAmount: 0,
      updatedAt: now,
    };

    await client.query(
      "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('jobs', $1, $2::jsonb, NOW(), NOW())",
      [jobId, JSON.stringify(job)]
    );

    order.pickupPartnerId = partner.id;
    order.pickupPartnerName = job.partnerName;
    order.orderStatus = 'QC_SCHEDULED';
    order.updatedAt = now;
    await client.query(
      "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'orders' AND id = $1",
      [orderRow.id, JSON.stringify(order)]
    );

    const event = {
      id: `trk-pickup-assigned-${Date.now()}`,
      orderId: orderRow.id,
      title: 'PICKUP REQUEST ASSIGNED — ACCEPTANCE & FARM QC REQUIRED',
      description: `${job.partnerName} has received the farm pickup request. The assigned partner must accept it, perform farm-gate QC, pass inspection, and then confirm physical pickup.`,
      location: job.originAddress,
      timestamp: now,
      actorRole: 'AgroChain Dispatch',
      actorName: 'Area-based Auto Assignment',
      status: 'IN_PROGRESS',
    };
    await client.query(
      "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('trackingEvents', $1, $2::jsonb, NOW(), NOW()) ON CONFLICT (resource, id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()",
      [event.id, JSON.stringify(event)]
    );

    await client.query('COMMIT');
    return res.status(201).json({ job });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Pre-QC pickup assignment failed:', error.message);
    return res.status(500).json({ message: 'Could not assign a pickup partner to this order' });
  } finally {
    client.release();
  }
});



const allowedResources = new Set([
  'users',
  'farms',
  'crops',
  'batches',
  'products',
  'warehouses',
  'inventory',
  'deliveryPartners',
  'warehouseApplications',
  'orders',
  'jobs',
  'qualityChecks',
  'codRecords',
  'settlements',
  'trackingEvents',
  'godowns',
  'godownShipments',
]);

const resourceWriteRoles = {
  users: ['admin'],
  farms: ['admin', 'farmer'],
  crops: ['admin'],
  batches: ['admin', 'farmer'],
  products: ['admin', 'farmer'],
  warehouses: ['admin', 'warehouse'],
  inventory: ['admin', 'warehouse'],
  deliveryPartners: ['admin', 'warehouse'],
  orders: ['admin', 'buyer', 'farmer', 'delivery', 'warehouse', 'inspector'],
  jobs: ['admin', 'buyer', 'delivery', 'warehouse'],
  qualityChecks: ['admin', 'inspector', 'warehouse', 'delivery'],
  codRecords: ['admin', 'warehouse', 'delivery'],
  settlements: ['admin', 'warehouse'],
  trackingEvents: ['admin', 'buyer', 'delivery', 'warehouse', 'inspector'],
  godowns: ['admin', 'warehouse'],
  godownShipments: ['admin', 'delivery', 'warehouse'],
};

function canReadResource(role, resource) {
  if (resource === 'users') return role === 'admin';
  if (resource === 'settlements') return ['admin', 'farmer', 'warehouse'].includes(role);
  if (resource === 'codRecords') return ['admin', 'warehouse'].includes(role);
  return allowedResources.has(resource);
}

function canWriteResource(role, resource) {
  return resourceWriteRoles[resource]?.includes(role) === true;
}

// Warehouse intake is committed as one server-side transaction. The warehouse
// manager can receive only a handed-over pickup assigned to their own origin facility.
app.post('/api/warehouse/intake/:jobId', requireAuth, async (req, res) => {
  if (req.auth.role !== 'warehouse') {
    return res.status(403).json({ message: 'Only the assigned origin warehouse manager can receive this pickup' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const owned = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'warehouses' AND data->>'managerId' = $1 FOR UPDATE",
      [String(req.auth.sub)]
    );
    if (owned.rowCount !== 1) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Your account must be linked to exactly one warehouse facility before intake' });
    }
    const warehouseRow = owned.rows[0];
    const warehouse = warehouseRow.data || {};
    const jobResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'jobs' AND id = $1 FOR UPDATE",
      [req.params.jobId]
    );
    const jobRow = jobResult.rows[0];
    const job = jobRow?.data || {};
    if (!jobRow || job.type !== 'PICKUP') {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pickup job not found' });
    }
    const pickupStatus = String(job.status || '').toUpperCase();
    if (!['PICKED_UP', 'WAREHOUSE_HANDOVER'].includes(pickupStatus)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Partner must complete farm pickup and handover before warehouse intake' });
    }
    const orderResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'orders' AND id = $1 FOR UPDATE",
      [String(job.orderId || '')]
    );
    const orderRow = orderResult.rows[0];
    const order = orderRow?.data || {};
    const assignedWarehouseId = String(order.originWarehouseId || order.warehouseId || '');
    if (!orderRow || assignedWarehouseId !== String(warehouseRow.id)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'This consignment is not assigned to your origin warehouse' });
    }
    if (order.paymentMethod !== 'COD') {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Warehouse intake is currently enabled only for COD orders' });
    }
    const qcResult = await client.query(
      `SELECT id, data
       FROM agrochain_records
       WHERE resource = 'qualityChecks'
         AND data->>'orderId' = $2
       ORDER BY
         CASE WHEN id = $1 AND $1 <> '' THEN 0 ELSE 1 END,
         created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [String(order.qualityCheckId || ''), orderRow.id]
    );
    const qc = qcResult.rows[0]?.data;
    if (!qc || String(qc.status || '').toUpperCase() !== 'APPROVED' ||
        String(order.qualityStatus || '').toUpperCase() !== 'APPROVED') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Warehouse intake is blocked until farm-gate QC is approved' });
    }
    const existingShipment = await client.query(
      "SELECT id FROM agrochain_records WHERE resource = 'godownShipments' AND data->>'orderId' = $1 LIMIT 1 FOR UPDATE",
      [orderRow.id]
    );
    if (existingShipment.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'A warehouse transfer record already exists for this order' });
    }

    const normalizeArea = (value) => String(value || '').normalize('NFC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
    const customerAddress = String(order.buyerAddress || '');
    const customerCity = String(order.buyerCity || '');
    const addressText = normalizeArea([customerAddress, customerCity].join(' '));
    const godownRows = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'godowns' ORDER BY created_at ASC"
    );
    let destination = null;
    for (const row of godownRows.rows) {
      const data = row.data || {};
      const areas = Array.isArray(data.serviceAreas) ? data.serviceAreas : [];
      if (String(data.status || '').toUpperCase() !== 'ACTIVE') continue;
      if (areas.some((area) => {
        const term = normalizeArea(area);
        return term && (' ' + addressText + ' ').includes(' ' + term + ' ');
      })) {
        destination = { id: row.id, data };
        break;
      }
    }
    const manualRouting = !destination;
    const now = new Date().toISOString();
    const crypto = await import('node:crypto');
    const shipmentId = 'shp_' + crypto.randomUUID();
    const shipment = {
      id: shipmentId,
      orderId: orderRow.id,
      orderNumber: order.orderNumber || orderRow.id,
      productName: (Array.isArray(order.items) ? order.items : []).map((item) => String(item.quantity || 0) + ' ' + String(item.unit || 'kg') + ' ' + String(item.productName || 'Product')).join(', '),
      quantity: (Array.isArray(order.items) ? order.items : []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
      unit: order.items?.[0]?.unit || 'kg',
      weightKg: Number(order.totalWeightKg) || (Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : 0),
      sourceWarehouseId: warehouseRow.id,
      sourceWarehouseName: warehouse.name || warehouseRow.id,
      destinationGodownId: destination?.id || 'unassigned',
      destinationGodownName: destination?.data?.name || 'Unassigned - Manual Routing Required',
      customerArea: customerCity || customerAddress,
      customerAddress,
      customerName: order.buyerName || '',
      customerPhone: order.buyerPhone || '',
      productCondition: 'EXCELLENT',
      transferStatus: manualRouting ? 'MANUAL_ROUTING_REQUIRED' : 'PENDING_DISPATCH',
      ...(manualRouting ? { exceptionNotes: 'No active destination godown service area matched the customer address. Manual routing review required.' } : {}),
    };
    job.status = 'WAREHOUSE_HANDOVER';
    job.handoverConfirmed = true;
    job.handoverManagerId = req.auth.sub;
    job.handoverConfirmedAt = now;
    job.updatedAt = now;
    order.orderStatus = manualRouting ? 'MANUAL_ROUTING_REQUIRED' : 'WAREHOUSE_RECEIVED';
    order.warehouseId = warehouseRow.id;
    order.warehouseName = warehouse.name || warehouseRow.id;
    order.originWarehouseId = warehouseRow.id;
    order.originWarehouseName = warehouse.name || warehouseRow.id;
    order.godownReceivedAt = now;
    if (destination) {
      order.destinationGodownId = destination.id;
      order.destinationGodownName = destination.data.name;
    }
    order.updatedAt = now;
    const event = {
      id: 'trk_' + crypto.randomUUID(),
      orderId: orderRow.id,
      title: manualRouting ? 'RECEIVED AT ORIGIN WAREHOUSE — MANUAL ROUTING REQUIRED' : 'RECEIVED AT ORIGIN WAREHOUSE',
      description: manualRouting
        ? 'Origin warehouse verified the consignment. No active destination godown matched the customer address; shipment is held for manual routing.'
        : 'Origin warehouse verified the consignment and assigned the active destination godown ' + destination.data.name + '.',
      location: warehouse.name || warehouse.location || warehouseRow.id,
      timestamp: now,
      actorRole: 'Warehouse Manager',
      actorName: String(req.body?.staffName || warehouse.managerName || 'Warehouse Manager'),
      status: manualRouting ? 'IN_PROGRESS' : 'COMPLETED',
    };
    await client.query(
      "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'jobs' AND id = $1",
      [jobRow.id, JSON.stringify(job)]
    );
    await client.query(
      "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'orders' AND id = $1",
      [orderRow.id, JSON.stringify(order)]
    );
    await client.query(
      "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('godownShipments', $1, $2::jsonb, NOW(), NOW())",
      [shipmentId, JSON.stringify(shipment)]
    );
    await client.query(
      "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('trackingEvents', $1, $2::jsonb, NOW(), NOW())",
      [event.id, JSON.stringify(event)]
    );
    await client.query('COMMIT');
    return res.status(200).json({ order, job, shipment, event });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Warehouse intake transaction failed:', error.message);
    return res.status(500).json({ message: 'Warehouse intake failed; no partial changes were committed' });
  } finally {
    client.release();
  }
});

// Origin warehouse manager explicitly selects an active destination for an exception shipment.
app.post('/api/warehouse/shipments/:shipmentId/reroute', requireAuth, async (req, res) => {
  if (req.auth.role !== 'warehouse') return res.status(403).json({ message: 'Only the origin warehouse manager can reroute this consignment' });
  const destinationId = String(req.body?.destinationGodownId || '').trim();
  if (!destinationId || destinationId === 'unassigned') return res.status(400).json({ message: 'Select an active destination godown' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const shipmentResult = await client.query("SELECT id,data FROM agrochain_records WHERE resource='godownShipments' AND id=$1 FOR UPDATE", [req.params.shipmentId]);
    const shipmentRow = shipmentResult.rows[0];
    if (!shipmentRow) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Shipment not found' }); }
    const shipment = shipmentRow.data || {};
    if (shipment.transferStatus !== 'MANUAL_ROUTING_REQUIRED') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Only shipments awaiting manual routing can be rerouted' });
    }
    const sourceResult = await client.query("SELECT id,data FROM agrochain_records WHERE resource='warehouses' AND id=$1 AND data->>'managerId'=$2 FOR UPDATE", [String(shipment.sourceWarehouseId || ''), String(req.auth.sub)]);
    if (!sourceResult.rows[0]) { await client.query('ROLLBACK'); return res.status(403).json({ message: 'You are not the manager of this origin warehouse' }); }
    const destinationResult = await client.query("SELECT id,data FROM agrochain_records WHERE resource='godowns' AND id=$1 AND upper(coalesce(data->>'status',''))='ACTIVE'", [destinationId]);
    const destination = destinationResult.rows[0];
    if (!destination) { await client.query('ROLLBACK'); return res.status(409).json({ message: 'Selected destination godown is missing or inactive' }); }
    const orderResult = await client.query("SELECT id,data FROM agrochain_records WHERE resource='orders' AND id=$1 FOR UPDATE", [String(shipment.orderId || '')]);
    const orderRow = orderResult.rows[0];
    if (!orderRow) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Related order not found' }); }
    const now = new Date().toISOString();
    shipment.destinationGodownId = destination.id;
    shipment.destinationGodownName = destination.data?.name || destination.id;
    shipment.transferStatus = 'PENDING_DISPATCH';
    delete shipment.exceptionNotes;
    const order = orderRow.data || {};
    order.destinationGodownId = destination.id;
    order.destinationGodownName = destination.data?.name || destination.id;
    order.orderStatus = 'WAREHOUSE_RECEIVED';
    order.updatedAt = now;
    const { randomUUID } = await import('node:crypto');
    const event = { id:'trk_'+randomUUID(), orderId:orderRow.id, title:'MANUAL DESTINATION ROUTING CONFIRMED', description:'Origin warehouse manager routed the consignment to '+(destination.data?.name || destination.id)+'.', location:sourceResult.rows[0].data?.name || shipment.sourceWarehouseName, timestamp:now, actorRole:'Warehouse Manager', actorName:String(sourceResult.rows[0].data?.managerName || 'Warehouse Manager'), status:'COMPLETED' };
    await client.query("UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='godownShipments' AND id=$1", [shipmentRow.id, JSON.stringify(shipment)]);
    await client.query("UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='orders' AND id=$1", [orderRow.id, JSON.stringify(order)]);
    await client.query("INSERT INTO agrochain_records(resource,id,data,created_at,updated_at) VALUES('trackingEvents',$1,$2::jsonb,NOW(),NOW())", [event.id, JSON.stringify(event)]);
    await client.query('COMMIT');
    return res.json({ shipment, order, event });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Manual warehouse reroute failed:', error.message);
    return res.status(500).json({ message: 'Rerouting failed; no partial changes were committed' });
  } finally { client.release(); }
});

// Dispatch a received consignment from its origin warehouse in one transaction.
app.post('/api/warehouse/shipments/:shipmentId/dispatch', requireAuth, async (req, res) => {
  if (req.auth.role !== 'warehouse') return res.status(403).json({ message: 'Only the origin warehouse manager can dispatch this consignment' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const shipmentResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource='godownShipments' AND id=$1 FOR UPDATE",
      [req.params.shipmentId]
    );
    const shipmentRow = shipmentResult.rows[0];
    const shipment = shipmentRow?.data || {};
    if (!shipmentRow) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Shipment not found' }); }
    if (shipment.transferStatus !== 'PENDING_DISPATCH') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Only a shipment pending dispatch can be dispatched' });
    }
    const warehouseResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource='warehouses' AND id=$1 AND data->>'managerId'=$2 FOR UPDATE",
      [String(shipment.sourceWarehouseId || ''), String(req.auth.sub)]
    );
    if (!warehouseResult.rows[0]) { await client.query('ROLLBACK'); return res.status(403).json({ message: 'You are not the manager of this origin warehouse' }); }
    const destinationResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource='godowns' AND id=$1 AND upper(coalesce(data->>'status',''))='ACTIVE'",
      [String(shipment.destinationGodownId || '')]
    );
    const destination = destinationResult.rows[0];
    if (!destination) { await client.query('ROLLBACK'); return res.status(409).json({ message: 'Destination godown is missing or inactive' }); }
    const orderResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource='orders' AND id=$1 FOR UPDATE",
      [String(shipment.orderId || '')]
    );
    const orderRow = orderResult.rows[0];
    if (!orderRow) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Related order not found' }); }
    const now = new Date().toISOString();
    const carrier = String(req.body?.carrier || '').trim().slice(0,120) || 'AgroChain Carrier';
    const sourceName = String(shipment.sourceWarehouseName || '').trim();
    if (!sourceName) { await client.query('ROLLBACK'); return res.status(409).json({ message: 'Origin warehouse name is missing; dispatch blocked to prevent an incorrect route record' }); }
    shipment.transferStatus = 'GODOWN_TRANSFER_IN_TRANSIT';
    shipment.dispatchDate = now;
    shipment.transferCarrier = carrier;
    const order = orderRow.data || {};
    order.orderStatus = 'GODOWN_TRANSFER_IN_TRANSIT';
    order.destinationGodownId = destination.id;
    order.destinationGodownName = destination.data?.name || destination.id;
    order.updatedAt = now;
    const { randomUUID } = await import('node:crypto');
    const events = [
      { id:'trk_'+randomUUID(), orderId:orderRow.id, title:'DISPATCHED TO DESTINATION GODOWN', description:'Consignment dispatched from '+sourceName+' via '+carrier+'.', location:sourceName, timestamp:now, actorRole:'Warehouse Manager', actorName:String(warehouseResult.rows[0].data?.managerName || 'Warehouse Manager'), status:'COMPLETED' },
      { id:'trk_'+randomUUID(), orderId:orderRow.id, title:'IN TRANSIT TO DESTINATION GODOWN', description:'Shipment is travelling to '+(destination.data?.name || destination.id)+'.', location:sourceName+' to '+(destination.data?.name || destination.id), timestamp:now, actorRole:'Fleet Carrier', actorName:carrier, status:'IN_PROGRESS' }
    ];
    await client.query("UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='godownShipments' AND id=$1",[shipmentRow.id,JSON.stringify(shipment)]);
    await client.query("UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='orders' AND id=$1",[orderRow.id,JSON.stringify(order)]);
    for (const event of events) await client.query("INSERT INTO agrochain_records(resource,id,data,created_at,updated_at) VALUES('trackingEvents',$1,$2::jsonb,NOW(),NOW())",[event.id,JSON.stringify(event)]);
    await client.query('COMMIT');
    return res.json({shipment,order,events});
  } catch(error) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('Warehouse dispatch failed:',error.message);
    return res.status(500).json({message:'Dispatch failed; no partial changes were committed'});
  } finally { client.release(); }
});

// Record arrival only by the manager of the assigned active destination godown.
app.post('/api/godowns/shipments/:shipmentId/arrive', requireAuth, async (req, res) => {
  if (req.auth.role !== 'warehouse') return res.status(403).json({message:'Only a destination warehouse manager can record arrival'});
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const shipmentResult = await client.query("SELECT id,data FROM agrochain_records WHERE resource='godownShipments' AND id=$1 FOR UPDATE",[req.params.shipmentId]);
    const shipmentRow=shipmentResult.rows[0];
    const shipment=shipmentRow?.data || {};
    if(!shipmentRow){await client.query('ROLLBACK');return res.status(404).json({message:'Shipment not found'});}
    if(shipment.transferStatus!=='GODOWN_TRANSFER_IN_TRANSIT'){await client.query('ROLLBACK');return res.status(409).json({message:'Only an in-transit shipment can be marked arrived'});}
    const godownResult=await client.query("SELECT id,data FROM agrochain_records WHERE resource='godowns' AND id=$1 AND data->>'managerId'=$2 AND upper(coalesce(data->>'status',''))='ACTIVE' FOR UPDATE",[String(shipment.destinationGodownId||''),String(req.auth.sub)]);
    if(!godownResult.rows[0]){await client.query('ROLLBACK');return res.status(403).json({message:'You are not the active manager of this destination godown'});}
    const orderResult=await client.query("SELECT id,data FROM agrochain_records WHERE resource='orders' AND id=$1 FOR UPDATE",[String(shipment.orderId||'')]);
    const orderRow=orderResult.rows[0];
    if(!orderRow){await client.query('ROLLBACK');return res.status(404).json({message:'Related order not found'});}
    const now=new Date().toISOString();
    const godown=godownResult.rows[0].data||{};
    shipment.transferStatus='ARRIVED_LOCAL_GODOWN';
    shipment.arrivalDate=now;
    const order=orderRow.data||{};
    order.orderStatus='ARRIVED_LOCAL_GODOWN';
    order.updatedAt=now;
    const {randomUUID}=await import('node:crypto');
    const event={id:'trk_'+randomUUID(),orderId:orderRow.id,title:'ARRIVED AT DESTINATION GODOWN',description:'Transport vehicle arrived at '+(godown.name||shipment.destinationGodownName||'destination godown')+'. Awaiting physical acceptance by its manager.',location:godown.name||shipment.destinationGodownName||godown.address||'Destination godown',timestamp:now,actorRole:'Logistics Fleet',actorName:String(shipment.transferCarrier||'AgroChain Carrier'),status:'COMPLETED'};
    await client.query("UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='godownShipments' AND id=$1",[shipmentRow.id,JSON.stringify(shipment)]);
    await client.query("UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='orders' AND id=$1",[orderRow.id,JSON.stringify(order)]);
    await client.query("INSERT INTO agrochain_records(resource,id,data,created_at,updated_at) VALUES('trackingEvents',$1,$2::jsonb,NOW(),NOW())",[event.id,JSON.stringify(event)]);
    await client.query('COMMIT');
    return res.json({shipment,order,event});
  } catch(error) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('Destination arrival failed:',error.message);
    return res.status(500).json({message:'Arrival update failed; no partial changes were committed'});
  } finally {client.release();}
});

// Destination godown acceptance is authoritative and atomic. It cannot be
// performed by the origin warehouse manager or by a manager of another godown.
app.post('/api/godowns/shipments/:shipmentId/accept', requireAuth, async (req, res) => {
  if (req.auth.role !== 'warehouse') {
    return res.status(403).json({ message: 'Only a warehouse manager can accept a destination-godown shipment' });
  }
  const { randomUUID } = await import('node:crypto');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const shipmentResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'godownShipments' AND (id = $1 OR data->>'orderId' = $1) LIMIT 1 FOR UPDATE",
      [req.params.shipmentId]
    );
    const shipmentRow = shipmentResult.rows[0];
    const shipment = shipmentRow?.data;
    if (!shipment) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Shipment not found' });
    }
    if (shipment.transferStatus !== 'ARRIVED_LOCAL_GODOWN') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Shipment must be marked arrived before acceptance' });
    }
    const godownResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'godowns' AND id = $1 AND data->>'managerId' = $2 AND upper(coalesce(data->>'status','')) = 'ACTIVE' FOR UPDATE",
      [String(shipment.destinationGodownId || ''), String(req.auth.sub)]
    );
    const godownRow = godownResult.rows[0];
    if (!godownRow) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Your account is not the active manager of this destination godown' });
    }
    const godown = godownRow.data || {};
    const orderResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'orders' AND id = $1 FOR UPDATE",
      [String(shipment.orderId || '')]
    );
    const orderRow = orderResult.rows[0];
    if (!orderRow) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Related order not found' });
    }
    const order = orderRow.data || {};
    const now = new Date().toISOString();
    const managerName = String(godown.managerName || req.body?.managerName || 'Warehouse Manager');
    shipment.transferStatus = 'GODOWN_RECEIVED';
    shipment.acceptedDate = now;
    shipment.acceptedByManagerId = req.auth.sub;
    shipment.acceptedByManagerName = managerName;
    godown.itemCount = Number(godown.itemCount || 0) + 1;
    godown.currentStockMetricTons = Number(((Number(godown.currentStockMetricTons || 0) + Number(shipment.weightKg || 0) / 1000)).toFixed(2));
    order.orderStatus = 'GODOWN_RECEIVED';
    order.godownReceivedAt = now;
    order.godownId = godownRow.id;
    order.godownName = godown.name || shipment.destinationGodownName || godownRow.id;

    const event = {
      id: 'trk_' + randomUUID(),
      orderId: orderRow.id,
      title: 'RECEIVED AT DESTINATION GODOWN',
      description: 'Destination godown verified the consignment quantity, packaging and seals and accepted the shipment.',
      location: order.godownName,
      timestamp: now,
      actorRole: 'Warehouse Manager',
      actorName: managerName,
      status: 'COMPLETED',
    };
    const partnerRows = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'deliveryPartners' AND upper(coalesce(data->>'approvalStatus','')) = 'APPROVED' AND coalesce((data->>'canDeliver')::boolean, false) = true ORDER BY coalesce((data->>'activeJobsCount')::int,0), id FOR UPDATE"
    );
    const normalizeArea = (value) => String(value || '').normalize('NFC').toLocaleLowerCase().replace(/[^\\p{L}\\p{N}]+/gu, ' ').trim().replace(/\\s+/g, ' ');
    const areaText = normalizeArea([shipment.customerArea, shipment.customerAddress, order.buyerCity, order.buyerAddress].filter(Boolean).join(' '));
    const matchesCustomerArea = (partner) => {
      const rawAreas = Array.isArray(partner.serviceAreas) ? partner.serviceAreas : [];
      const areas = rawAreas.flatMap((entry) => {
        if (typeof entry === 'string') return [entry];
        if (entry && typeof entry === 'object') return [entry.area, entry.name, entry.city, entry.district].filter(Boolean);
        return [];
      });
      return areas.some((area) => {
        const term = normalizeArea(area);
        return term.length >= 2 && areaText.length > 0 && (' ' + areaText + ' ').includes(' ' + term + ' ');
      });
    };
    const existingJobResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'jobs' AND data->>'orderId' = $1 AND data->>'type' = 'DELIVERY' ORDER BY created_at ASC LIMIT 1 FOR UPDATE",
      [orderRow.id]
    );
    const existingDeliveryJob = existingJobResult.rows[0] || null;
    const assignedExistingPartner = existingDeliveryJob
      ? partnerRows.find((row) => row.id === String(existingDeliveryJob.data?.partnerId || '') && matchesCustomerArea(row.data || {}))
      : null;
    const partnerRow = assignedExistingPartner || (!existingDeliveryJob ? partnerRows.find((row) => matchesCustomerArea(row.data || {})) : null);
    let deliveryJob = existingDeliveryJob?.data || null;
    if (partnerRow) {
      const partner = partnerRow.data || {};
      const isExistingAssignment = Boolean(existingDeliveryJob && assignedExistingPartner);
      if (!deliveryJob) {
        deliveryJob = {
          id: 'job_' + randomUUID(),
          jobCode: 'JOB-DEL-' + Math.floor(100000 + Math.random() * 900000),
          orderId: orderRow.id,
          orderNumber: order.orderNumber || shipment.orderNumber || orderRow.id,
          type: 'DELIVERY',
          productSummary: shipment.productName || 'Order delivery',
          assignedDate: now,
          status: 'ASSIGNED',
        };
      }
      Object.assign(deliveryJob, {
        partnerId: partnerRow.id,
        partnerName: partner.name || '',
        originAddress: [godown.name, godown.address].filter(Boolean).join(', '),
        destinationAddress: shipment.customerAddress || order.buyerAddress || '',
        godownId: godownRow.id,
        godownName: godown.name || '',
        status: 'ASSIGNED',
        updatedAt: now,
        codAmount: order.paymentMethod === 'COD' ? Number(order.totalAmount || 0) : 0,
      });
      if (!isExistingAssignment) {
        partner.activeJobsCount = Number(partner.activeJobsCount || 0) + 1;
        await client.query(
          "UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='deliveryPartners' AND id=$1",
          [partnerRow.id, JSON.stringify(partner)]
        );
      }
      shipment.transferStatus = 'DELIVERY_PARTNER_ASSIGNED';
      shipment.assignedPartnerId = partnerRow.id;
      shipment.assignedPartnerName = partner.name || '';
      shipment.assignedDate = now;
      order.deliveryPartnerId = partnerRow.id;
      order.deliveryPartnerName = partner.name || '';
      order.deliveryAssignmentStatus = 'ASSIGNED';
      order.orderStatus = 'DELIVERY_PARTNER_ASSIGNED';
      if (existingDeliveryJob) {
        await client.query(
          "UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='jobs' AND id=$1",
          [existingDeliveryJob.id, JSON.stringify(deliveryJob)]
        );
      } else {
        await client.query(
          "INSERT INTO agrochain_records (resource,id,data,created_at,updated_at) VALUES ('jobs',$1,$2::jsonb,NOW(),NOW())",
          [deliveryJob.id, JSON.stringify(deliveryJob)]
        );
      }
    } else {
      shipment.transferStatus = 'DELIVERY_ASSIGNMENT_PENDING';
      order.orderStatus = 'DELIVERY_ASSIGNMENT_PENDING';
      order.deliveryAssignmentStatus = 'PENDING';
      event.title = existingDeliveryJob
        ? 'DESTINATION GODOWN RECEIVED — EXISTING DELIVERY JOB NEEDS REVIEW'
        : 'DESTINATION GODOWN RECEIVED — DELIVERY ASSIGNMENT PENDING';
      event.description = existingDeliveryJob
        ? 'The destination godown accepted the consignment, but its existing delivery job is not assigned to an approved partner serving this customer area. Manual assignment review is required; the existing job was preserved.'
        : 'The destination godown accepted the consignment. No approved delivery partner matched the customer service area; manual assignment is required.';
      event.status = 'IN_PROGRESS';
    }
    await client.query("UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='godownShipments' AND id=$1", [shipmentRow.id, JSON.stringify(shipment)]);
    await client.query("UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='godowns' AND id=$1", [godownRow.id, JSON.stringify(godown)]);
    await client.query("UPDATE agrochain_records SET data=$2::jsonb,updated_at=NOW() WHERE resource='orders' AND id=$1", [orderRow.id, JSON.stringify(order)]);
    await client.query(
      "INSERT INTO agrochain_records (resource,id,data,created_at,updated_at) VALUES ('trackingEvents',$1,$2::jsonb,NOW(),NOW())",
      [event.id, JSON.stringify(event)]
    );
    await client.query('COMMIT');
    return res.status(200).json({ shipment, order, godown, deliveryJob, event, assignmentSuccess: Boolean(partnerRow) });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Destination godown acceptance failed:', error.message);
    return res.status(500).json({ message: 'Godown acceptance failed; no partial changes were committed' });
  } finally {
    client.release();
  }
});

// Server-authoritative delivery confirmation. COD customer payment becomes PAID
// at the exact moment the assigned delivery partner verifies the customer's OTP.
app.post('/api/orders/:id/confirm-delivery', requireAuth, async (req, res) => {
  if (req.auth.role !== 'delivery') {
    return res.status(403).json({ message: 'Only the assigned delivery partner can confirm delivery' });
  }
  const { id } = req.params;
  const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'orders' AND (id = $1 OR data->>'orderNumber' = $1) LIMIT 1 FOR UPDATE",
      [id]
    );
    const order = found.rows[0]?.data;
    const accountResult = await client.query("SELECT email FROM auth_users WHERE id = $1", [req.auth.sub]);
    const accountEmail = accountResult.rows[0]?.email;
    const partnerResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'deliveryPartners' AND (id = $1 OR lower(data->>'email') = lower($2)) LIMIT 1",
      [req.auth.sub, accountEmail || '']
    );
    const partnerRecord = partnerResult.rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found' });
    }
    const authorizedPartnerId = partnerRecord?.id || req.auth.sub;
    if (order.deliveryPartnerId !== authorizedPartnerId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'This order is not assigned to your delivery account' });
    }
    if (order.isDeliveryVerified || order.orderStatus === 'DELIVERED') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Delivery has already been confirmed' });
    }
    if ((Number(order.otpAttemptsRemaining) || 0) <= 0) {
      await client.query('ROLLBACK');
      return res.status(423).json({ message: 'Delivery OTP is locked; contact dispatch support' });
    }
    if (!otp || otp !== String(order.deliveryOtp || '').trim()) {
      order.otpAttemptsRemaining = Math.max(0, (Number(order.otpAttemptsRemaining) || 0) - 1);
      await client.query(
        "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'orders' AND id = $1",
        [found.rows[0].id || id, JSON.stringify(order)]
      );
      await client.query('COMMIT');
      return res.status(400).json({ message: 'Invalid customer delivery OTP', attemptsRemaining: order.otpAttemptsRemaining });
    }

    const orderId = found.rows[0].id;
    const deliveryJobResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'jobs' AND data->>'orderId' = $1 AND data->>'type' = 'DELIVERY' LIMIT 1 FOR UPDATE",
      [orderId]
    );
    const deliveryJobRow = deliveryJobResult.rows[0];
    const deliveryJob = deliveryJobRow?.data;
    if (!deliveryJob || deliveryJob.partnerId !== authorizedPartnerId ||
        String(deliveryJob.status || '').toUpperCase() !== 'OUT_FOR_DELIVERY') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'The assigned delivery job must be marked Out for Delivery before customer OTP confirmation' });
    }
    const shipmentResult = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'godownShipments' AND data->>'orderId' = $1 LIMIT 1 FOR UPDATE",
      [orderId]
    );
    const shipmentRow = shipmentResult.rows[0] || null;
    const shipment = shipmentRow?.data || null;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    order.orderStatus = 'DELIVERED';
    order.isDeliveryVerified = true;
    order.deliveryConfirmedAt = now;
    order.updatedAt = now;
    if (order.paymentMethod === 'COD') {
      order.paymentStatus = 'PAID';
      order.paymentVerifiedAt = now;
    }
    await client.query(
      "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'orders' AND id = $1",
      [found.rows[0].id || id, JSON.stringify(order)]
    );

    let codRecord = null;
    if (order.paymentMethod === 'COD') {
      const existingCod = await client.query(
        "SELECT id, data FROM agrochain_records WHERE resource = 'codRecords' AND data->>'orderId' = $1 LIMIT 1 FOR UPDATE",
        [found.rows[0].id || id]
      );
      codRecord = existingCod.rows[0]?.data || {
        id: `cod-${Date.now()}`,
        orderId: found.rows[0].id || id,
        orderNumber: order.orderNumber,
        deliveryPartnerId: authorizedPartnerId,
        deliveryPartnerName: partnerRecord?.data?.name || order.deliveryPartnerName || 'Delivery Partner',
        amount: Number(order.totalAmount),
        collectedAt: now,
        depositStatus: 'CASH_COLLECTED',
      };
      if (!existingCod.rows[0]) {
        await client.query(
          "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('codRecords', $1, $2::jsonb, NOW(), NOW())",
          [codRecord.id, JSON.stringify(codRecord)]
        );
      }
    }

    const eventTime = now;
    deliveryJob.status = 'DELIVERED';
    deliveryJob.deliveryOtpSubmittedAt = eventTime;
    deliveryJob.proofNotes = typeof req.body?.notes === 'string' && req.body.notes.trim()
      ? req.body.notes.trim().slice(0, 500)
      : 'Customer handover confirmed by valid OTP.';
    deliveryJob.updatedAt = eventTime;
    await client.query(
      "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'jobs' AND id = $1",
      [deliveryJobRow.id, JSON.stringify(deliveryJob)]
    );
    if (shipmentRow && shipment) {
      shipment.transferStatus = 'DELIVERED';
      shipment.deliveredAt = eventTime;
      await client.query(
        "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'godownShipments' AND id = $1",
        [shipmentRow.id, JSON.stringify(shipment)]
      );
    }
    const { randomUUID } = await import('node:crypto');
    const events = [
      {
        id: 'trk_' + randomUUID(), orderId, title: 'DELIVERED SUCCESSFULLY',
        description: 'Product handed over to the customer after server-side OTP verification.',
        location: order.buyerAddress || order.buyerCity || '',
        timestamp: eventTime, actorRole: 'Delivery Partner',
        actorName: partnerRecord?.data?.name || order.deliveryPartnerName || 'Delivery Partner',
        status: 'COMPLETED',
      },
      {
        id: 'trk_' + randomUUID(), orderId, title: 'CUSTOMER OTP VERIFIED',
        description: 'Customer delivery OTP was verified by the server.',
        location: order.buyerCity || order.buyerAddress || '',
        timestamp: eventTime, actorRole: 'Automated Security System',
        actorName: 'AgroChain Core Engine', status: 'COMPLETED',
      },
    ];
    if (order.paymentMethod === 'COD') {
      events.push({
        id: 'trk_' + randomUUID(), orderId, title: 'COD CUSTOMER PAYMENT CONFIRMED',
        description: 'Cash was collected from the customer at delivery; customer payment is now PAID. Farmer payout remains pending.',
        location: order.buyerCity || order.buyerAddress || '',
        timestamp: eventTime, actorRole: 'Automated Payment System',
        actorName: 'AgroChain Core Engine', status: 'COMPLETED',
      });
    }
    for (const event of events) {
      await client.query(
        "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('trackingEvents', $1, $2::jsonb, NOW(), NOW())",
        [event.id, JSON.stringify(event)]
      );
    }

    let settlement = null;
    const existingSettlement = await client.query(
      "SELECT id, data FROM agrochain_records WHERE resource = 'settlements' AND data->>'orderId' = $1 LIMIT 1 FOR UPDATE",
      [orderId]
    );
    if (!existingSettlement.rows[0]) {
      const productSalesValue = Number(order.productSubtotal) || 0;
      const commissionDeducted = Math.round(productSalesValue * 0.1);
      settlement = {
        id: `stl-${Date.now()}`,
        orderId,
        orderNumber: order.orderNumber,
        farmerId: order.items?.[0]?.farmerId || '',
        farmerName: order.items?.[0]?.farmerName || 'Farmer',
        productSalesValue,
        commissionDeducted,
        netPayout: productSalesValue - commissionDeducted,
        deliveryFee: Number(order.deliveryFee) || 0,
        productSummary: (order.items || []).map((item) => `${item.quantity} ${item.unit} ${item.productName}`).join(', '),
        deliveryDate: now,
        deliveryConfirmedAt: now,
        paymentMethod: 'bKash',
        settlementStatus: 'PENDING',
      };
      await client.query(
        "INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('settlements', $1, $2::jsonb, NOW(), NOW())",
        [settlement.id, JSON.stringify(settlement)]
      );
    } else {
      settlement = existingSettlement.rows[0].data;
      settlement.deliveryConfirmedAt = now;
      settlement.settlementStatus = ['PAID', 'COMPLETED'].includes(settlement.settlementStatus) ? settlement.settlementStatus : 'PENDING';
      await client.query(
        "UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'settlements' AND id = $1",
        [existingSettlement.rows[0].id, JSON.stringify(settlement)]
      );
    }

    await client.query('COMMIT');
    return res.json({ success: true, order, job: deliveryJob, shipment, events, codRecord, settlement, message: 'Delivery confirmed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delivery confirmation failed:', error.message);
    return res.status(500).json({ message: 'Could not confirm delivery' });
  } finally {
    client.release();
  }
});

// Customer cancellation is server-authoritative and only allowed before physical pickup.
app.post('/api/orders/:id/cancel', requireAuth, async (req, res) => {
  if (req.auth.role !== 'buyer') return res.status(403).json({ message: 'Only customers can cancel their own orders' });
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query("SELECT id, data FROM agrochain_records WHERE resource = 'orders' AND (id = $1 OR data->>'orderNumber' = $1) LIMIT 1 FOR UPDATE", [id]);
    const row = found.rows[0];
    const order = row?.data;
    if (!order) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Order not found' }); }
    if (order.buyerId !== req.auth.sub) { await client.query('ROLLBACK'); return res.status(403).json({ message: 'You can only cancel your own orders' }); }
    if (order.orderStatus === 'CANCELLED') { await client.query('ROLLBACK'); return res.status(409).json({ message: 'This order has already been cancelled' }); }
    if (order.orderStatus === 'DELIVERED' || order.isDeliveryVerified === true) { await client.query('ROLLBACK'); return res.status(409).json({ message: 'Delivered orders cannot be cancelled' }); }
    const pickupStarted = new Set(['PICKED_UP','IN_TRANSIT','IN_TRANSIT_CENTRAL','WAREHOUSE_RECEIVED','IN_WAREHOUSE','GODOWN_ASSIGNED','GODOWN_TRANSFER_IN_TRANSIT','ARRIVED_LOCAL_GODOWN','GODOWN_RECEIVED','ARRIVED_REGIONAL_GODOWN','DELIVERY_PARTNER_ASSIGNED','DELIVERY_ASSIGNMENT_PENDING','MANUAL_ROUTING_REQUIRED','DELIVERY_ACCEPTED','DELIVERY_PARTNER_COLLECTED','OUT_FOR_DELIVERY']);
    if (pickupStarted.has(String(order.orderStatus || '').toUpperCase()) || order.partnerCollectedAt || order.handoverInitiatedAt || order.outForDeliveryAt) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'This order can no longer be cancelled because pickup or shipment processing has started' });
    }
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    order.orderStatus = 'CANCELLED'; order.cancelledAt = now; order.cancelledBy = 'buyer'; order.updatedAt = now;
    await client.query("UPDATE agrochain_records SET data = $2::jsonb, updated_at = NOW() WHERE resource = 'orders' AND id = $1", [row.id, JSON.stringify(order)]);
    const event = { id: `trk-cancel-${row.id}-${Date.now()}`, orderId: row.id, title: 'ORDER CANCELLED', description: 'Customer cancelled the order before pickup.', location: order.buyerCity || '', timestamp: now, actorRole: 'Customer', actorName: order.buyerName || 'Customer', status: 'COMPLETED' };
    await client.query("INSERT INTO agrochain_records (resource, id, data, created_at, updated_at) VALUES ('trackingEvents', $1, $2::jsonb, NOW(), NOW())", [event.id, JSON.stringify(event)]);
    await client.query('COMMIT');
    return res.json({ success: true, order, event, message: 'Order cancelled successfully' });
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); console.error('Order cancellation failed:', error.message); return res.status(500).json({ message: 'Could not cancel this order' }); }
  finally { client.release(); }
});
// Public, read-only QR lookup. Return only fields intended for customer-facing traceability.
app.get('/api/public/batches/:batchCode', async (req, res) => {
  const batchCode = String(req.params.batchCode || '').trim().toUpperCase();
  if (!batchCode || batchCode.length > 100) {
    return res.status(400).json({ message: 'A valid batch code is required' });
  }

  try {
    const batchResult = await pool.query(
      `SELECT id, data FROM agrochain_records
       WHERE resource = 'batches' AND UPPER(BTRIM(data->>'batchCode')) = $1
       LIMIT 1`,
      [batchCode]
    );
    if (!batchResult.rowCount) return res.status(404).json({ message: 'Batch not found' });

    const batchRow = batchResult.rows[0];
    const batchData = batchRow.data || {};
    const batch = {
      id: batchRow.id,
      batchCode: batchData.batchCode || batchCode,
      cropName: batchData.cropName || '',
      variety: batchData.variety || '',
      farmId: batchData.farmId || '',
      farmName: batchData.farmName || '',
      farmerName: batchData.farmerName || '',
      sowingDate: batchData.sowingDate || '',
      harvestDate: batchData.harvestDate || '',
      estimatedQuantityKg: Number(batchData.estimatedQuantityKg || 0),
      actualQuantityKg: Number(batchData.actualQuantityKg || 0),
      qualityStatus: batchData.qualityStatus || 'PENDING',
    };

    const productsResult = await pool.query(
      `SELECT id, data FROM agrochain_records
       WHERE resource = 'products' AND data->>'batchId' = $1
       ORDER BY created_at DESC`,
      [batchRow.id]
    );
    const products = productsResult.rows.map((row) => {
      const data = row.data || {};
      return {
        id: row.id,
        batchId: data.batchId || batchRow.id,
        farmerName: data.farmerName || batch.farmerName,
        farmName: data.farmName || batch.farmName,
        name: data.name || batch.cropName,
        category: data.category || '',
        cropType: data.cropType || batch.cropName,
        variety: data.variety || batch.variety,
        description: data.description || '',
        pricePerUnit: Number(data.pricePerUnit || 0),
        unit: data.unit || 'kg',
        availableQuantity: Number(data.availableQuantity || 0),
        harvestDate: data.harvestDate || batch.harvestDate,
        imageUrl: data.imageUrl || '',
        qualityStatus: data.qualityStatus || batch.qualityStatus,
        isOrganic: Boolean(data.isOrganic),
      };
    });

    return res.set('Cache-Control', 'no-store').json({ batch, products });
  } catch (error) {
    console.error('Public batch traceability lookup failed:', error.message);
    return res.status(500).json({ message: 'Could not load batch traceability details' });
  }
});

// Read records for a resource.
app.get('/api/records/:resource', requireAuth, async (req, res) => {
  const { resource } = req.params;

  if (!allowedResources.has(resource)) {
    return res.status(400).json({ message: 'Invalid resource' });
  }


  if (!canReadResource(req.auth.role, resource)) {
    return res.status(403).json({ message: 'You do not have permission to read this resource' });
  }

  try {
    const result = await pool.query(
      `SELECT id, data, created_at, updated_at
       FROM agrochain_records
       WHERE resource = $1
       ORDER BY created_at ASC`,
      [resource]
    );

    let rows = result.rows;
    let deliveryPartnerProfileId = null;
    if (req.auth.role === 'warehouse') {
      const owned = await pool.query("SELECT id, data FROM agrochain_records WHERE resource = 'warehouses' AND data->>'managerId' = $1", [req.auth.sub]);
      const warehouseIds = new Set(owned.rows.map((row) => row.id));
      const orderRowsForRouting = ['orders', 'jobs'].includes(resource)
        ? await pool.query("SELECT id, data FROM agrochain_records WHERE resource = 'orders'")
        : { rows: [] };
      const originWarehouseByOrderId = new Map();
      for (const orderRow of orderRowsForRouting.rows) {
        const orderData = orderRow.data || {};
        let originWarehouseId = String(orderData.warehouseId || orderData.originWarehouseId || '');
        let originWarehouseName = String(orderData.warehouseName || orderData.originWarehouseName || '');
        if (!originWarehouseId) {
          const resolved = await resolveOriginWarehouseForOrder(pool, orderData);
          if (resolved) {
            originWarehouseId = resolved.id;
            originWarehouseName = resolved.data.name || '';
          }
        }
        originWarehouseByOrderId.set(orderRow.id, { id: originWarehouseId, name: originWarehouseName });
      }
      const godownsResult = await pool.query("SELECT id, data FROM agrochain_records WHERE resource = 'godowns'");
      const godownIds = new Set(godownsResult.rows.filter((row) =>
        row.data?.managerId === req.auth.sub || warehouseIds.has(row.data?.warehouseId)
      ).map((row) => row.id));
      if (resource === 'warehouses') rows = owned.rows;
      else if (resource === 'inventory') rows = rows.filter((row) => warehouseIds.has(row.data?.warehouseId));
      else if (resource === 'godowns') {
        // Origin warehouse staff need destination-facility routing metadata to
        // dispatch consignments. Expose only active routing fields, not manager
        // contact details or operational capacity for unrelated godowns.
        rows = godownsResult.rows
          .filter((row) => godownIds.has(row.id) || String(row.data?.status || '').toUpperCase() === 'ACTIVE')
          .map((row) => {
            if (godownIds.has(row.id)) return row;
            const data = row.data || {};
            return {
              ...row,
              data: {
                id: row.id,
                name: data.name || '',
                code: data.code || '',
                address: data.address || '',
                city: data.city || '',
                serviceAreas: Array.isArray(data.serviceAreas) ? data.serviceAreas : [],
                status: data.status || 'ACTIVE',
                managerId: '',
                managerName: '',
                managerPhone: '',
                contactNumber: '',
                capacityMetricTons: 0,
                currentStockMetricTons: 0,
                itemCount: 0,
              },
            };
          });
      }
      else if (resource === 'godownShipments') rows = rows.filter((row) =>
        warehouseIds.has(row.data?.sourceWarehouseId) || godownIds.has(row.data?.destinationGodownId)
      );
      else if (resource === 'orders') {
        // Warehouse access follows the farm-origin facility. Buyer destination is
        // a later-mile routing attribute and must not determine first-mile intake.
        rows = rows
          .filter((row) => row.data?.paymentMethod === 'COD' &&
            warehouseIds.has(originWarehouseByOrderId.get(row.id)?.id || String(row.data?.warehouseId || row.data?.originWarehouseId || '')))
          .map((row) => {
            const origin = originWarehouseByOrderId.get(row.id);
            return origin?.id ? { ...row, data: { ...row.data, warehouseId: origin.id, warehouseName: origin.name, originWarehouseId: origin.id, originWarehouseName: origin.name } } : row;
          });
      }
      else if (resource === 'codRecords') {
        // COD cash custody records are visible only to the manager responsible
        // for the warehouse assigned to the related COD order.
        const ownedCodOrders = await pool.query(
          "SELECT id FROM agrochain_records WHERE resource = 'orders' AND data->>'paymentMethod' = 'COD' AND data->>'warehouseId' = ANY($1::text[])",
          [[...warehouseIds]]
        );
        const ownedCodOrderIds = new Set(ownedCodOrders.rows.map((row) => row.id));
        rows = rows.filter((row) => ownedCodOrderIds.has(String(row.data?.orderId || '')));
      }
      else if (resource === 'jobs') {
        // A warehouse manager may only see pickup jobs for orders assigned to
        // their warehouse, and delivery jobs routed to one of their godowns.
        // Resolve the relationship through persisted order records; LogisticsJob
        // intentionally has no warehouseId field of its own.
        const orderById = new Map(orderRowsForRouting.rows.map((row) => [row.id, row.data]));
        rows = rows.filter((row) => {
          const job = row.data || {};
          const order = orderById.get(job.orderId);
          if (!order) return false;
          if (job.type === 'PICKUP') {
            const origin = originWarehouseByOrderId.get(job.orderId);
            return warehouseIds.has(origin?.id || String(order.warehouseId || order.originWarehouseId || ''));
          }
          if (job.type === 'DELIVERY') {
            const destinationGodownId = String(job.godownId || order.destinationGodownId || order.godownId || '');
            return godownIds.has(destinationGodownId);
          }
          return false;
        });
      }
    }
    if (resource === 'settlements') {
      const role = req.auth.role;
      if (role === 'farmer') {
        rows = rows.filter((row) => row.data?.farmerId === req.auth.sub);
      } else if (role === 'warehouse') {
        const ownedWarehouseRows = await pool.query(
          "SELECT id FROM agrochain_records WHERE resource = 'warehouses' AND data->>'managerId' = $1",
          [req.auth.sub]
        );
        const ownedWarehouseIds = new Set(ownedWarehouseRows.rows.map((row) => row.id));
        const ownedCodOrders = await pool.query(
          "SELECT id FROM agrochain_records WHERE resource = 'orders' AND data->>'paymentMethod' = 'COD' AND data->>'warehouseId' = ANY($1::text[])",
          [[...ownedWarehouseIds]]
        );
        const ownedCodOrderIds = new Set(ownedCodOrders.rows.map((row) => row.id));
        rows = rows.filter((row) => ownedCodOrderIds.has(String(row.data?.orderId || '')));
      }
    }

    if (req.auth.role === 'delivery' && ['deliveryPartners', 'jobs', 'orders', 'qualityChecks'].includes(resource)) {
      // Use one account identity rule everywhere: linked user ID, legacy profile ID,
      // or the authenticated account email for older partner records.
      const accountResult = await pool.query(
        "SELECT email FROM auth_users WHERE id = $1 AND role = 'delivery' LIMIT 1",
        [req.auth.sub]
      );
      const accountEmail = String(accountResult.rows[0]?.email || '').trim().toLowerCase();
      const partnerRows = await pool.query(
        "SELECT id, data FROM agrochain_records WHERE resource = 'deliveryPartners'"
      );
      const ownPartners = partnerRows.rows.filter((row) =>
        row.id === req.auth.sub ||
        row.data?.userId === req.auth.sub ||
        (accountEmail && String(row.data?.email || '').trim().toLowerCase() === accountEmail)
      ).sort((left, right) => {
        const priority = (row) => row.data?.userId === req.auth.sub ? 0 : row.id === req.auth.sub ? 1 : 2;
        return priority(left) - priority(right);
      });
      // A login account must resolve to one canonical partner profile, not
      // accidentally combine multiple legacy records sharing an email.
      const ownPartner = ownPartners[0];
      deliveryPartnerProfileId = ownPartner?.id || null;
      if (resource === 'deliveryPartners') {
        rows = ownPartner ? [ownPartner] : [];
      } else if (resource === 'jobs') {
        const ownPartnerIds = new Set(ownPartner ? [ownPartner.id] : []);
        rows = rows.filter((row) => ownPartnerIds.has(row.data?.partnerId));
      }
    }

    if (resource === 'orders') {
      const role = req.auth.role;
      if (role === 'buyer') {
        rows = rows.filter((row) => row.data?.buyerId === req.auth.sub);
      } else if (role === 'farmer') {
        rows = rows.filter((row) =>
          Array.isArray(row.data?.items) &&
          row.data.items.some((item) => item?.farmerId === req.auth.sub)
        );
      } else if (role === 'warehouse') {
        // Warehouse staff only access COD orders; online orders are not exposed.
        rows = rows.filter((row) => row.data?.paymentMethod === 'COD');
      } else if (role === 'delivery') {
        rows = rows.filter((row) =>
          (deliveryPartnerProfileId && row.data?.deliveryPartnerId === deliveryPartnerProfileId) ||
          row.data?.deliveryPartnerId === req.auth.sub ||
          (deliveryPartnerProfileId && row.data?.pickupPartnerId === deliveryPartnerProfileId)
        );
      }
      // The recipient's OTP is a bearer secret: only the owning buyer may read it.
      if (role !== 'buyer') {
        rows = rows.map((row) => {
          if (!row.data) return row;
          const { deliveryOtp, otpAttemptsRemaining, otpExpiresAt, ...safeOrder } = row.data;
          return { ...row, data: safeOrder };
        });
      }
    }

    if (req.auth.role === 'delivery' && resource === 'qualityChecks' && deliveryPartnerProfileId) {
      const assignedPickupOrders = await pool.query(
        "SELECT data->>'orderId' AS order_id FROM agrochain_records WHERE resource = 'jobs' AND data->>'type' = 'PICKUP' AND data->>'partnerId' = $1",
        [deliveryPartnerProfileId]
      );
      const orderIds = new Set(assignedPickupOrders.rows.map((row) => row.order_id).filter(Boolean));
      rows = rows.filter((row) => orderIds.has(row.data?.orderId));
    }
    res.json(rows);
  } catch (error) {
    console.error('Could not read records:', error.message);
    res.status(500).json({ message: 'Could not read records' });
  }
});

// Create or update one record.
app.put('/api/records/:resource/:id', requireAuth, async (req, res) => {
  const { resource, id } = req.params;
  const data = req.body?.data;
  const role = req.auth.role;

  if (!allowedResources.has(resource)) {
    return res.status(400).json({ message: 'Invalid resource' });
  }

  // Buyers may create a single pending QC queue record for an order they own.
  // They cannot edit existing QC records or submit inspection results.
  const buyerPendingQcCreate = role === 'buyer' && resource === 'qualityChecks';
  if (!canWriteResource(role, resource) && !buyerPendingQcCreate) {
    return res.status(403).json({ message: 'You do not have permission to write this resource' });
  }

  if (resource === 'orders' && role === 'warehouse' && data?.paymentMethod !== 'COD') {
    return res.status(403).json({ message: 'Warehouse managers may only process COD orders' });
  }

  if (!id || !data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({
      message: 'A record ID and JSON object in data are required',
    });
  }

  if (typeof data.id !== 'string' || data.id !== id) {
    return res.status(400).json({
      message: 'The record ID must match the URL',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      'SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))',
      [resource, id]
    );

    const existingResult = await client.query(
      `SELECT data
       FROM agrochain_records
       WHERE resource = $1 AND id = $2
       FOR UPDATE`,
      [resource, id]
    );

    const existing = existingResult.rows[0]?.data;

    if (role === 'warehouse' && resource === 'orders') {
      const ownedWarehouseRows = await client.query(
        "SELECT id FROM agrochain_records WHERE resource = 'warehouses' AND data->>'managerId' = $1",
        [req.auth.sub]
      );
      const ownedWarehouseIds = new Set(ownedWarehouseRows.rows.map((row) => row.id));
      const existingWarehouseId = String(existing?.warehouseId || '');
      const incomingWarehouseId = String(data.warehouseId || '');
      if (!existing ||
          existing.paymentMethod !== 'COD' ||
          data.paymentMethod !== 'COD' ||
          !existingWarehouseId ||
          !ownedWarehouseIds.has(existingWarehouseId) ||
          incomingWarehouseId !== existingWarehouseId) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          message: 'You can only process existing COD orders assigned to your own warehouse',
        });
      }
    }

    if (role === 'warehouse' && resource === 'settlements') {
      const ownedWarehouseRows = await client.query(
        "SELECT id FROM agrochain_records WHERE resource = 'warehouses' AND data->>'managerId' = $1",
        [req.auth.sub]
      );
      const ownedWarehouseIds = new Set(ownedWarehouseRows.rows.map((row) => row.id));
      const settlementOrderId = String(data.orderId || '');
      const existingOrderId = String(existing?.orderId || '');
      const relatedOrderResult = settlementOrderId
        ? await client.query(
            "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1 FOR UPDATE",
            [settlementOrderId]
          )
        : { rows: [] };
      const relatedOrder = relatedOrderResult.rows[0]?.data;
      if (!relatedOrder ||
          relatedOrder.paymentMethod !== 'COD' ||
          !ownedWarehouseIds.has(String(relatedOrder.warehouseId || '')) ||
          (existing && existingOrderId !== settlementOrderId)) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          message: 'You can only process COD farmer payouts for orders assigned to your own warehouse',
        });
      }
    }

    if (role === 'warehouse' && resource === 'jobs') {
      const ownedWarehouseRows = await client.query(
        "SELECT id FROM agrochain_records WHERE resource = 'warehouses' AND data->>'managerId' = $1",
        [req.auth.sub]
      );
      const ownedWarehouseIds = new Set(ownedWarehouseRows.rows.map((row) => row.id));
      const ownedGodownRows = await client.query(
        "SELECT id FROM agrochain_records WHERE resource = 'godowns' AND (data->>'managerId' = $1 OR data->>'warehouseId' IN (SELECT id FROM agrochain_records WHERE resource = 'warehouses' AND data->>'managerId' = $1))",
        [req.auth.sub]
      );
      const ownedGodownIds = new Set(ownedGodownRows.rows.map((row) => row.id));
      const canManageJob = async (job) => {
        if (!job || !['PICKUP', 'DELIVERY'].includes(job.type) || !job.orderId) return false;
        const orderResult = await client.query(
          "SELECT id, data FROM agrochain_records WHERE resource = 'orders' AND id = $1",
          [String(job.orderId)]
        );
        const order = orderResult.rows[0]?.data;
        if (!order) return false;
        if (job.type === 'PICKUP') {
          return ownedWarehouseIds.has(String(order.warehouseId || ''));
        }
        const destinationGodownId = String(job.godownId || order.destinationGodownId || order.godownId || '');
        return ownedGodownIds.has(destinationGodownId);
      };
      const existingOwned = !existing || await canManageJob(existing);
      const incomingOwned = await canManageJob(data);
      if (!existingOwned || !incomingOwned) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'You can only manage pickup and delivery jobs linked to your assigned warehouse or godown' });
      }
    }

    if (role === 'warehouse' && ['warehouses', 'inventory', 'godowns', 'godownShipments'].includes(resource)) {
      const ownedRows = await client.query(
        "SELECT id FROM agrochain_records WHERE resource = 'warehouses' AND data->>'managerId' = $1",
        [req.auth.sub]
      );
      const ownedWarehouseIds = new Set(ownedRows.rows.map((row) => row.id));
      const ownedGodownRows = await client.query(
        "SELECT id FROM agrochain_records WHERE resource = 'godowns' AND (data->>'managerId' = $1 OR data->>'warehouseId' IN (SELECT id FROM agrochain_records WHERE resource = 'warehouses' AND data->>'managerId' = $1))",
        [req.auth.sub]
      );
      const ownedGodownIds = new Set(ownedGodownRows.rows.map((row) => row.id));
      let permitted = false;
      if (resource === 'warehouses') {
        permitted = Boolean(existing && existing.managerId === req.auth.sub && data.managerId === req.auth.sub);
      } else if (resource === 'inventory') {
        permitted = ownedWarehouseIds.has(String(data.warehouseId || '')) &&
          (!existing || ownedWarehouseIds.has(String(existing.warehouseId || '')));
      } else if (resource === 'godowns') {
        permitted = data.managerId === req.auth.sub &&
          (!existing || existing.managerId === req.auth.sub);
      } else if (resource === 'godownShipments') {
        // Every endpoint supplied by the client must belong to this manager.
        // Checking only one side would let a manager create or redirect a
        // transfer into another manager's godown.
        const sourceId = String(data.sourceWarehouseId || '');
        const destinationId = String(data.destinationGodownId || '');
        const existingSourceId = String(existing?.sourceWarehouseId || '');
        const existingDestinationId = String(existing?.destinationGodownId || '');
        const hasSource = Boolean(sourceId);
        const hasDestination = Boolean(destinationId);
        const sourceOwned = hasSource && ownedWarehouseIds.has(sourceId);
        const destinationOwned = hasDestination && ownedGodownIds.has(destinationId);
        const existingSourceOwned = !existing || !existingSourceId || ownedWarehouseIds.has(existingSourceId);
        const existingDestinationOwned = !existing || !existingDestinationId || ownedGodownIds.has(existingDestinationId);
        const existingAccess = !existing || existingSourceOwned || existingDestinationOwned;
        // A manager may process a transfer when either endpoint is theirs.
        // An external endpoint may be preserved, but never changed or redirected.
        const sourceAllowed = sourceOwned || (Boolean(existing) && sourceId === existingSourceId && !existingSourceOwned);
        const destinationAllowed = destinationOwned || (Boolean(existing) && destinationId === existingDestinationId && !existingDestinationOwned);
        permitted = (hasSource || hasDestination) &&
          sourceAllowed &&
          destinationAllowed &&
          (sourceOwned || destinationOwned || existingAccess) &&
          existingAccess;
      }
      if (!permitted) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'You can only manage records belonging to your assigned warehouse or godown' });
      }
    }

    if (buyerPendingQcCreate) {
      if (existing) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Buyers may only create a new pending QC queue record' });
      }
      if (data.status !== 'PENDING' || data.inspectorId || data.inspectorName !== 'Unassigned Inspector') {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Buyer-created QC records must remain pending and unassigned' });
      }
      const orderResult = await client.query(
        "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1 LIMIT 1",
        [String(data.orderId || '')]
      );
      const ownedOrder = orderResult.rows[0]?.data;
      if (!ownedOrder || String(ownedOrder.buyerId || '') !== String(req.auth.sub)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'QC queue record must belong to an order created by this buyer' });
      }
    }

    // Delivery accounts may perform QC only when their partner profile is assigned
    // to this order's active pickup job. Never trust a client-supplied inspector ID.
    let assignedPickupQcPartner = null;
    let authorizedPickupQcOrder = false;
    if (resource === 'orders' && role === 'delivery' && existing && data.qualityStatus !== existing.qualityStatus) {
      const accountResult = await client.query('SELECT email FROM auth_users WHERE id = $1 LIMIT 1', [req.auth.sub]);
      const accountEmail = accountResult.rows[0]?.email || req.auth.email || '';
      const partnerResult = await client.query(
        "SELECT id FROM agrochain_records WHERE resource = 'deliveryPartners' AND (id = $1 OR lower(data->>'email') = lower($2)) LIMIT 1",
        [req.auth.sub, accountEmail]
      );
      const partnerId = partnerResult.rows[0]?.id;
      if (partnerId) {
        const pickupResult = await client.query(
          "SELECT id FROM agrochain_records WHERE resource = 'jobs' AND data->>'orderId' = $1 AND data->>'type' = 'PICKUP' AND data->>'partnerId' = $2 LIMIT 1",
          [id, partnerId]
        );
        const qcResult = await client.query(
          "SELECT data FROM agrochain_records WHERE resource = 'qualityChecks' AND data->>'orderId' = $1 AND data->>'inspectorId' = $2 LIMIT 1",
          [id, partnerId]
        );
        const qc = qcResult.rows[0]?.data;
        authorizedPickupQcOrder = Boolean(pickupResult.rows[0] && qc && qc.status === data.qualityStatus &&
          ['APPROVED', 'REJECTED', 'RECHECK_REQUIRED'].includes(String(qc.status)));
      }
      if (!authorizedPickupQcOrder) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Only the assigned pickup person may update order QC status after recording the inspection' });
      }
    }
    if (resource === 'qualityChecks' && role === 'delivery' && existing?.orderId) {
      const accountResult = await client.query('SELECT email FROM auth_users WHERE id = $1 LIMIT 1', [req.auth.sub]);
      const accountEmail = accountResult.rows[0]?.email || req.auth.email || '';
      const partnerResult = await client.query(
        "SELECT id, data FROM agrochain_records WHERE resource = 'deliveryPartners' AND (id = $1 OR lower(data->>'email') = lower($2)) LIMIT 1",
        [req.auth.sub, accountEmail]
      );
      const partner = partnerResult.rows[0];
      if (partner) {
        const pickupResult = await client.query(
          "SELECT data FROM agrochain_records WHERE resource = 'jobs' AND data->>'orderId' = $1 AND data->>'type' = 'PICKUP' AND data->>'partnerId' = $2 LIMIT 1",
          [existing.orderId, partner.id]
        );
        const pickupJob = pickupResult.rows[0]?.data;
        // Farm-gate QC is permitted only after this partner accepts the assignment.
        if (pickupJob && String(pickupJob.status || '').toUpperCase() === 'ACCEPTED') {
          assignedPickupQcPartner = { id: partner.id, name: partner.data?.name || partner.data?.partnerName || 'Assigned pickup person' };
        }
      }
      if (!assignedPickupQcPartner) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Only the pickup person assigned to this order may perform farm-gate QC' });
      }
      if (data.inspectorId !== assignedPickupQcPartner.id) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'QC inspector identity must match the assigned pickup person' });
      }
      if (data.status !== undefined && data.status !== existing.status) {
        const moisture = Number(data.moistureContentPercent);
        const pesticide = Number(data.pesticideResiduePpm);
        const foreignMatter = Number(data.foreignMatterPercent);
        if (!Number.isFinite(moisture) || moisture < 0 || moisture > 100 ||
            !Number.isFinite(pesticide) || pesticide < 0 ||
            !Number.isFinite(foreignMatter) || foreignMatter < 0 || foreignMatter > 100 ||
            typeof data.remarks !== 'string' || !data.remarks.trim() ||
            !['Grade A - Premium', 'Grade B - Standard', 'Grade C - Commercial'].includes(data.grade)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'A QC decision requires valid measured values, grade, and inspection remarks' });
        }
      }
    }

    // QC decisions are server-authorized: inspectors may act only on records
    // explicitly assigned to their authenticated account. Admins may manage all QC.
    if (resource === 'qualityChecks' && role === 'inspector') {
      if (!existing || existing.inspectorId !== req.auth.sub) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'This QC inspection is not assigned to your inspector account' });
      }
      if (data.inspectorId !== existing.inspectorId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Inspectors cannot reassign QC records' });
      }
      if (data.status !== undefined && data.status !== existing.status) {
        const moisture = Number(data.moistureContentPercent);
        const pesticide = Number(data.pesticideResiduePpm);
        const foreignMatter = Number(data.foreignMatterPercent);
        if (!Number.isFinite(moisture) || moisture < 0 || moisture > 100 ||
            !Number.isFinite(pesticide) || pesticide < 0 ||
            !Number.isFinite(foreignMatter) || foreignMatter < 0 || foreignMatter > 100 ||
            typeof data.remarks !== 'string' || !data.remarks.trim() ||
            !['Grade A - Premium', 'Grade B - Standard', 'Grade C - Commercial'].includes(data.grade)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'A QC decision requires valid measured values, grade, and inspection remarks' });
        }
      }
    }

    // Delivery partners may only update jobs assigned to their own persisted
    // partner profile. Enforce this for DELIVERY as well as PICKUP jobs.
    if (resource === 'jobs' && role === 'delivery' && !existing) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Delivery partners cannot create or self-assign jobs' });
    }
    if (resource === 'jobs' && role === 'delivery' && existing) {
      const accountResult = await client.query(
        'SELECT email FROM auth_users WHERE id = $1 LIMIT 1',
        [req.auth.sub]
      );
      const accountEmail = accountResult.rows[0]?.email || req.auth.email || '';
      const partnerResult = await client.query(
        "SELECT id, data FROM agrochain_records WHERE resource = 'deliveryPartners' AND (id = $1 OR data->>'userId' = $1 OR lower(data->>'email') = lower($2)) ORDER BY CASE WHEN data->>'userId' = $1 THEN 0 WHEN id = $1 THEN 1 ELSE 2 END LIMIT 1",
        [req.auth.sub, accountEmail]
      );
      const partner = partnerResult.rows[0]?.data;
      const partnerId = partnerResult.rows[0]?.id;
      // Account status (for example ACTIVE) is not partner approval.
      // Trust explicit approvalStatus first; status is only a legacy fallback.
      const explicitApprovalStatus = String(partner?.approvalStatus || '').trim().toUpperCase();
      const legacyPartnerStatus = String(partner?.status || '').trim().toUpperCase();
      const validPartnerApprovalStatuses = ['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING_APPROVAL'];
      const partnerApprovalStatus = validPartnerApprovalStatuses.includes(explicitApprovalStatus)
        ? explicitApprovalStatus
        : validPartnerApprovalStatuses.includes(legacyPartnerStatus)
          ? legacyPartnerStatus
          : '';
      const allowedStatuses = data.type === 'DELIVERY'
        ? ['ASSIGNED', 'ACCEPTED', 'DECLINED', 'REJECTED', 'EN_ROUTE', 'ARRIVED_AT_GODOWN', 'COLLECTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED']
        : ['ASSIGNED', 'ACCEPTED', 'DECLINED', 'REJECTED', 'QC_PENDING', 'EN_ROUTE', 'PICKED_UP', 'WAREHOUSE_HANDOVER', 'ARRIVED_AT_GODOWN', 'FAILED'];
      if (!partnerId || partnerApprovalStatus !== 'APPROVED' ||
          existing.partnerId !== partnerId || data.partnerId !== partnerId ||
          data.type !== existing.type ||
          !allowedStatuses.includes(String(data.status || '').toUpperCase())) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'You may only update your own approved partner job' });
      }

      if (existing.type === 'DELIVERY') {
        if (partner?.canDeliver !== true) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'Your approved partner profile is not enabled for customer doorstep delivery' });
        }
        const currentStatus = String(existing.status || '').toUpperCase();
        const nextStatus = String(data.status || '').toUpperCase();
        const transitions = {
          ASSIGNED: ['ACCEPTED', 'DECLINED'],
          ACCEPTED: ['ARRIVED_AT_GODOWN', 'FAILED'],
          ARRIVED_AT_GODOWN: ['COLLECTED', 'FAILED'],
          COLLECTED: ['OUT_FOR_DELIVERY', 'FAILED'],
          OUT_FOR_DELIVERY: ['FAILED'],
        };
        if (nextStatus !== currentStatus && !(transitions[currentStatus] || []).includes(nextStatus)) {
          await client.query('ROLLBACK');
          return res.status(409).json({ message: 'Delivery must follow: Assigned → Accepted → Arrived at destination godown → Collected → Out for Delivery → Customer OTP confirmation' });
        }
        if (['ARRIVED_AT_GODOWN', 'COLLECTED', 'OUT_FOR_DELIVERY'].includes(nextStatus)) {
          const shipmentResult = await client.query(
            "SELECT data FROM agrochain_records WHERE resource = 'godownShipments' AND data->>'orderId' = $1 LIMIT 1 FOR UPDATE",
            [String(existing.orderId || '')]
          );
          const shipment = shipmentResult.rows[0]?.data;
          const expectedShipmentStates = {
            ARRIVED_AT_GODOWN: ['DELIVERY_ACCEPTED'],
            COLLECTED: ['DELIVERY_ACCEPTED'],
            OUT_FOR_DELIVERY: ['DELIVERY_PARTNER_COLLECTED'],
          };
          if (!shipment || !expectedShipmentStates[nextStatus].includes(String(shipment.transferStatus || '').toUpperCase())) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'The destination godown handover must be recorded before this delivery step' });
          }
        }
      }

      // Enforce the pickup sequence on the server: accept first, QC while
      // accepted, then confirm physical pickup, then warehouse handover.
      if (existing.type === 'PICKUP') {
        const currentStatus = String(existing.status || '').toUpperCase();
        const nextStatus = String(data.status || '').toUpperCase();
        const transitions = {
          ASSIGNED: ['ACCEPTED', 'DECLINED'],
          ACCEPTED: ['PICKED_UP', 'FAILED'],
          PICKED_UP: ['WAREHOUSE_HANDOVER'],
          QC_PENDING: ['ACCEPTED', 'PICKED_UP', 'FAILED'],
        };
        if (!(transitions[currentStatus] || []).includes(nextStatus)) {
          await client.query('ROLLBACK');
          return res.status(409).json({ message: 'Pickup must follow this sequence: Assigned → Accepted → Farm QC Pass → Picked Up → Warehouse Handover' });
        }
      }
    }

    // Pickup jobs can be created as an assignment before QC, but only the
    // assigned pickup partner may accept/advance that job. Physical collection
    // remains server-blocked until the linked QC and order are both approved.
    if (resource === 'jobs' && data.type === 'PICKUP' && role !== 'admin') {
      if (!existing && role === 'buyer' && data.status === 'ASSIGNED') {
        const partnerResult = await client.query(
          "SELECT data FROM agrochain_records WHERE resource = 'deliveryPartners' AND id = $1 LIMIT 1",
          [data.partnerId]
        );
        const partner = partnerResult.rows[0]?.data;
        const orderResult = await client.query(
          "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1 LIMIT 1",
          [data.orderId]
        );
        if (!partner || partner.approvalStatus !== 'APPROVED' || partner.canPickup !== true || !orderResult.rows[0]) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'A pickup job requires an approved pickup-capable partner and a valid order' });
        }
      } else if (role === 'delivery' && existing) {
        const accountResult = await client.query('SELECT email FROM auth_users WHERE id = $1 LIMIT 1', [req.auth.sub]);
        const accountEmail = accountResult.rows[0]?.email || req.auth.email || '';
        const partnerResult = await client.query(
          "SELECT id FROM agrochain_records WHERE resource = 'deliveryPartners' AND (id = $1 OR lower(data->>'email') = lower($2)) LIMIT 1",
          [req.auth.sub, accountEmail]
        );
        const partnerId = partnerResult.rows[0]?.id;
        if (!partnerId || existing.partnerId !== partnerId || data.partnerId !== partnerId ||
            !['ASSIGNED', 'ACCEPTED', 'DECLINED', 'REJECTED', 'QC_PENDING', 'EN_ROUTE', 'PICKED_UP', 'WAREHOUSE_HANDOVER', 'ARRIVED_AT_GODOWN', 'FAILED'].includes(String(data.status || ''))) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'You may only update your own assigned pickup job' });
        }
      } else {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Only the assigned pickup partner or an administrator may manage this pickup job' });
      }
    }
    if (resource === 'jobs' && data.type === 'PICKUP' && ['PICKED_UP', 'WAREHOUSE_HANDOVER', 'ARRIVED_AT_GODOWN'].includes(String(data.status || '').toUpperCase())) {
      const qcResult = await client.query(
        "SELECT data FROM agrochain_records WHERE resource = 'qualityChecks' AND (data->>'orderId' = $1 OR id = $2) LIMIT 1",
        [data.orderId, data.orderId]
      );
      const qc = qcResult.rows[0]?.data;
      const orderResult = await client.query(
        "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1 LIMIT 1",
        [data.orderId]
      );
      const order = orderResult.rows[0]?.data;
      if (!qc || qc.status !== 'APPROVED' || !order || String(order.qualityStatus || '').toUpperCase() !== 'APPROVED') {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'Pickup is blocked until the linked order has an approved QC inspection' });
      }
    }

    // Buyers may create only their own orders. After creation, allow only the
    // checkout workflow to attach its pending QC record and approved pickup assignment.
    // Payment, totals, address, items, and other order fields remain immutable here.
    if (resource === 'orders' && role === 'buyer') {
      if (!existing && String(data.buyerId || '') !== String(req.auth.sub)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'You can only create orders for your own customer account' });
      }
      if (existing) {
        if (String(existing.buyerId || '') !== String(req.auth.sub)) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'You can only update your own order workflow metadata' });
        }

        const checkoutMutableFields = new Set([
          'qualityCheckId', 'qualityStatus', 'pickupPartnerId',
          'pickupPartnerName', 'orderStatus', 'updatedAt',
        ]);
        const allFields = new Set([...Object.keys(existing), ...Object.keys(data)]);
        const changedProtectedField = [...allFields].some((field) =>
          !checkoutMutableFields.has(field) &&
          JSON.stringify(existing[field]) !== JSON.stringify(data[field])
        );
        if (changedProtectedField) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'Order details cannot be changed after placement' });
        }

        if (data.qualityCheckId && data.qualityStatus === 'PENDING') {
          const qcResult = await client.query(
            "SELECT id, data FROM agrochain_records WHERE resource = 'qualityChecks' AND id = $1 AND data->>'orderId' = $2 LIMIT 1",
            [String(data.qualityCheckId), id]
          );
          const qc = qcResult.rows[0]?.data;
          if (!qc || qc.status !== 'PENDING' || qc.inspectorId ||
              qc.inspectorName !== 'Unassigned Inspector') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Only a pending, unassigned QC record for this order may be linked' });
          }
        }

        if (data.pickupPartnerId) {
          const partnerResult = await client.query(
            "SELECT data FROM agrochain_records WHERE resource = 'deliveryPartners' AND id = $1 LIMIT 1",
            [String(data.pickupPartnerId)]
          );
          const partner = partnerResult.rows[0]?.data;
          if (!partner || partner.approvalStatus !== 'APPROVED' || partner.canPickup !== true ||
              data.orderStatus !== 'QC_SCHEDULED') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Pickup assignment requires an approved pickup-capable partner' });
          }
        }

        if (data.orderStatus && !['CONFIRMED', 'QC_SCHEDULED'].includes(String(data.orderStatus))) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'Buyers cannot advance an order beyond checkout confirmation' });
        }
      }
    }

    // Warehouse may only complete COD farmer payouts. Online payouts remain admin-only.
    // Farmer payout completion is a financial transition, so enforce its
    // prerequisites on the server rather than trusting the admin UI.
    if (resource === 'settlements') {
      const paidStatuses = ['PAID', 'COMPLETED'];
      const isPaidNow = paidStatuses.includes(data.settlementStatus);
      const wasPaid = paidStatuses.includes(existing?.settlementStatus);

      const immutablePaidFields = [
        'settlementStatus', 'payoutReference', 'payoutDate',
        'amount', 'netPayout', 'productSalesValue', 'commissionDeducted',
        'farmerId', 'orderId', 'orderNumber', 'paymentMethod',
      ];
      if (wasPaid && (!isPaidNow ||
          immutablePaidFields.some((field) => data[field] !== existing[field]))) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'A completed farmer payout is immutable' });
      }

      if (isPaidNow && !wasPaid) {
        if (typeof data.payoutReference !== 'string' || !data.payoutReference.trim()) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'A real bank/MFS payout reference is required' });
        }
        const relatedOrderId = typeof data.orderId === 'string' ? data.orderId : '';
        const relatedOrderNumber = typeof data.orderNumber === 'string' ? data.orderNumber : '';
        const orderResult = relatedOrderId
          ? await client.query(
              "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1 FOR UPDATE",
              [relatedOrderId]
            )
          : await client.query(
              "SELECT data FROM agrochain_records WHERE resource = 'orders' AND data->>'orderNumber' = $1 LIMIT 1 FOR UPDATE",
              [relatedOrderNumber]
            );
        const relatedOrder = orderResult.rows[0]?.data;
        if (!relatedOrder || relatedOrder.orderStatus !== 'DELIVERED' ||
            relatedOrder.isDeliveryVerified !== true) {
          await client.query('ROLLBACK');
          return res.status(409).json({ message: 'Farmer payout requires server-verified delivery' });
        }

        if (relatedOrder.paymentMethod === 'COD') {
          const cashResult = await client.query(
            "SELECT data FROM agrochain_records WHERE resource = 'codRecords' AND data->>'orderId' = $1 LIMIT 1",
            [relatedOrder.id]
          );
          const cashRecord = cashResult.rows[0]?.data;
          if (!cashRecord || cashRecord.depositStatus !== 'CASH_DEPOSIT_VERIFIED') {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'COD farmer payout requires warehouse-verified cash deposit' });
          }
        }
      }
    }

    if (resource === 'codRecords' && role === 'delivery') {
      if (existing || data.depositStatus !== 'CASH_COLLECTED') {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Delivery partners may only create a COD collection record after delivery' });
      }
      const orderResult = await client.query(
        "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1 FOR UPDATE",
        [data.orderId]
      );
      const relatedOrder = orderResult.rows[0]?.data;
      if (!relatedOrder || relatedOrder.paymentMethod !== 'COD' ||
          relatedOrder.orderStatus !== 'DELIVERED' || relatedOrder.isDeliveryVerified !== true ||
          Number(data.amount) !== Number(relatedOrder.totalAmount)) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'COD collection can only be recorded for the exact amount after verified delivery' });
      }
    }

    if (resource === 'codRecords' && ['admin', 'warehouse'].includes(role)) {
      const immutableFields = ['orderId', 'orderNumber', 'deliveryPartnerId', 'deliveryPartnerName', 'amount', 'collectedAt'];
      if (!existing || data.depositStatus !== 'CASH_DEPOSIT_VERIFIED' ||
          existing.depositStatus === 'CASH_DEPOSIT_VERIFIED' ||
          immutableFields.some((field) => data[field] !== existing[field])) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Only an admin or warehouse manager may verify an existing COD deposit once, without changing its transaction details' });
      }

      const orderResult = await client.query(
        "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1 FOR UPDATE",
        [existing.orderId]
      );
      const relatedOrder = orderResult.rows[0]?.data;
      if (role === 'warehouse') {
        const ownedWarehouse = relatedOrder?.warehouseId
          ? await client.query(
              "SELECT id FROM agrochain_records WHERE resource = 'warehouses' AND id = $1 AND data->>'managerId' = $2 LIMIT 1",
              [String(relatedOrder.warehouseId), req.auth.sub]
            )
          : { rows: [] };
        if (!ownedWarehouse.rows[0]) {
          await client.query('ROLLBACK');
          return res.status(403).json({
            message: 'You can only verify COD deposits for orders assigned to your own warehouse',
          });
        }
      }
      if (!relatedOrder || relatedOrder.paymentMethod !== 'COD' ||
          relatedOrder.orderStatus !== 'DELIVERED' || relatedOrder.isDeliveryVerified !== true ||
          Number(existing.amount) !== Number(relatedOrder.totalAmount)) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'COD deposit can only be verified for the exact order amount after delivery is confirmed' });
      }
    }

    // Delivery verification is an authorization gate for farmer payouts.
    // Non-admin clients must not be able to self-confirm delivery via generic writes.
    if (resource === 'orders' && role !== 'admin') {
      const wasDeliveryVerified = existing?.isDeliveryVerified === true;
      const isDeliveryVerified = data.isDeliveryVerified === true;
      if (isDeliveryVerified !== wasDeliveryVerified) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          message: 'Only an administrator may change verified-delivery authorization',
        });
      }
    }

    // Payment fields must only be changed by a dedicated server-side payment flow.
    if (resource === 'orders') {
      const protectedPaymentFields = [
        'paymentStatus',
        'paymentMethod',
        'paymentGateway',
        'transactionId',
        'gatewayTransactionId',
        'paymentCurrency',
        'paymentVerifiedAt',
        'totalAmount',
        'productSubtotal',
        'deliveryFee',
        'platformCommission',
        'sellerNetEarnings',
      ];

      // Generic record writes must never create an already-paid order.
      if (!existing && data.paymentStatus === 'PAID') {
        await client.query('ROLLBACK');
        return res.status(403).json({
          message: 'Orders cannot be created as paid through the generic record API',
        });
      }

      // Existing orders cannot change payment or financial fields here.
      if (
        existing &&
        protectedPaymentFields.some(
          (field) => data[field] !== existing[field]
        )
      ) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          message: 'Payment and financial fields can only be changed through an authorized server-side flow',
        });
      }
    }
    if (resource === 'trackingEvents' && !['admin', 'inspector'].includes(role)) {
      const eventText = [
        data.title,
        data.description,
      ].filter((value) => typeof value === 'string').join(' ');

      const claimsQcDecision =
        /\bquality\s*check\b|\bqc\b|farm quality/i.test(eventText) &&
        /\bapproved?\b|\brejected?\b|\brecheck\b|\binspection\b/i.test(eventText);

      const claimsInspectorIdentity =
        typeof data.actorRole === 'string' &&
        /quality\s*inspector|inspector|agronomist/i.test(data.actorRole) &&
        !/pickup person \/ qc inspector/i.test(data.actorRole);

      let authorizedPickupQcEvent = false;
      if (role === 'delivery' && claimsQcDecision &&
          typeof data.actorRole === 'string' &&
          /pickup person \/ qc inspector/i.test(data.actorRole) &&
          typeof data.orderId === 'string') {
        const accountResult = await client.query('SELECT email FROM auth_users WHERE id = $1 LIMIT 1', [req.auth.sub]);
        const accountEmail = accountResult.rows[0]?.email || req.auth.email || '';
        const partnerResult = await client.query(
          "SELECT id FROM agrochain_records WHERE resource = 'deliveryPartners' AND (id = $1 OR lower(data->>'email') = lower($2)) LIMIT 1",
          [req.auth.sub, accountEmail]
        );
        const partnerId = partnerResult.rows[0]?.id;
        if (partnerId) {
          const pickupResult = await client.query(
            "SELECT id FROM agrochain_records WHERE resource = 'jobs' AND data->>'orderId' = $1 AND data->>'type' = 'PICKUP' AND data->>'partnerId' = $2 LIMIT 1",
            [data.orderId, partnerId]
          );
          const qcResult = await client.query(
            "SELECT data FROM agrochain_records WHERE resource = 'qualityChecks' AND data->>'orderId' = $1 AND data->>'inspectorId' = $2 LIMIT 1",
            [data.orderId, partnerId]
          );
          authorizedPickupQcEvent = Boolean(pickupResult.rows[0] && qcResult.rows[0]);
        }
      }
      if ((claimsQcDecision && !authorizedPickupQcEvent) || claimsInspectorIdentity) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          message: 'Only an admin, quality inspector, or assigned pickup person may create QC-related tracking events',
        });
      }
    }


    const validQcStatuses = [
      'PENDING',
      'APPROVED',
      'REJECTED',
      'RECHECK_REQUIRED',
    ];
    const privilegedQcRoles = ['admin', 'inspector'];
    const mayDecideQc = privilegedQcRoles.includes(role) || Boolean(assignedPickupQcPartner) || authorizedPickupQcOrder;
    const finalQcStatuses = ['APPROVED', 'REJECTED'];

    if (
      resource === 'qualityChecks' &&
      mayDecideQc &&
      existing &&
      existing.status !== data.status &&
      finalQcStatuses.includes(existing.status)
    ) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: 'A final QC decision cannot be changed directly; start an authorized reinspection flow',
      });
    }

    if (
      resource === 'orders' &&
      mayDecideQc &&
      existing &&
      existing.qualityStatus !== data.qualityStatus &&
      finalQcStatuses.includes(existing.qualityStatus)
    ) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: 'A final order QC decision cannot be changed directly; start an authorized reinspection flow',
      });
    }

    if (
      resource === 'qualityChecks' &&
      data.status !== undefined &&
      !validQcStatuses.includes(data.status)
    ) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Invalid quality check status',
      });
    }

    if (
      resource === 'orders' &&
      data.qualityStatus !== undefined &&
      !validQcStatuses.includes(data.qualityStatus)
    ) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Invalid order quality status',
      });
    }

    if (
      resource === 'qualityChecks' &&
      !mayDecideQc &&
      (
        (existing && existing.status !== data.status) ||
        (!existing && data.status !== undefined && data.status !== 'PENDING')
      )
    ) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        message: 'Only an admin or quality inspector may set or change QC status',
      });
    }

    if (
      resource === 'orders' &&
      !mayDecideQc &&
      (
        (existing && existing.qualityStatus !== data.qualityStatus) ||
        (!existing && data.qualityStatus !== undefined && data.qualityStatus !== 'PENDING')
      )
    ) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        message: 'Only an admin or quality inspector may set or change order QC status',
      });
    }
    // Create the initial pending QC record atomically with a buyer's new order.
    // Buyers cannot write the privileged qualityChecks resource directly; doing this
    // server-side prevents a confirmed order from being stranded without a QC queue item.
    if (resource === 'orders' && role === 'buyer' && !existing) {
      const firstItem = Array.isArray(data.items) ? data.items[0] : null;
      const qcId = typeof data.qualityCheckId === 'string' && data.qualityCheckId
        ? data.qualityCheckId
        : `qc-order-${id}`;
      const pendingQc = {
        id: qcId,
        orderId: id,
        batchId: firstItem?.productId || `unassigned-${id}`,
        batchCode: 'BATCH-PENDING-ASSIGNMENT',
        cropName: Array.isArray(data.items)
          ? data.items.map((item) => item?.productName).filter(Boolean).join(', ')
          : 'Commodity pending verification',
        farmerName: Array.isArray(data.items)
          ? data.items.map((item) => item?.farmerName).filter(Boolean).join(', ') || 'Farmer not assigned'
          : 'Farmer not assigned',
        farmLocation: 'Farm location pending verification',
        inspectorId: '',
        inspectorName: 'Unassigned Inspector',
        inspectionDate: '',
        inspectionLocation: 'FARM',
        grade: 'Not graded',
        moistureContentPercent: 0,
        pesticideResiduePpm: 0,
        foreignMatterPercent: 0,
        status: 'PENDING',
        remarks: 'Awaiting physical QC inspection. Measurements and grade have not been recorded.',
      };
      data.qualityCheckId = qcId;
      data.qualityStatus = 'PENDING';
      await client.query(
        `INSERT INTO agrochain_records (resource, id, data)
         VALUES ('qualityChecks', $1, $2::jsonb)
         ON CONFLICT (resource, id) DO NOTHING`,
        [qcId, JSON.stringify(pendingQc)]
      );
    }

    const result = await client.query(
      `INSERT INTO agrochain_records (resource, id, data)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (resource, id)
       DO UPDATE SET
         data = EXCLUDED.data,
         updated_at = NOW()
       RETURNING id, data, created_at, updated_at`,
      [resource, id, JSON.stringify(data)]
    );

    await client.query('COMMIT');
    return res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Could not save record:', error.message);
    return res.status(500).json({ message: 'Could not save record' });
  } finally {
    client.release();
  }
});
// Delete one record.
app.delete('/api/records/:resource/:id', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const { resource, id } = req.params;

  if (!allowedResources.has(resource)) {
    return res.status(400).json({ message: 'Invalid resource' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM agrochain_records
       WHERE resource = $1 AND id = $2
       RETURNING id`,
      [resource, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error('Could not delete record:', error.message);
    res.status(500).json({ message: 'Could not delete record' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT current_database() AS database, current_user AS user'
    );

    res.json({
      status: 'ok',
      database: result.rows[0].database,
      user: result.rows[0].user,
    });
  } catch (error) {
    console.error('Database health check failed:', error.message);

    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    name: 'AgroChain API',
    status: 'running',
  });
});

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET to a random secret of at least 32 characters');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (
        role IN ('admin', 'farmer', 'buyer', 'delivery', 'warehouse', 'inspector')
      ),
      status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE auth_users
      ADD COLUMN IF NOT EXISTS payout_method TEXT,
      ADD COLUMN IF NOT EXISTS payout_account_number TEXT,
      ADD COLUMN IF NOT EXISTS payout_bank_name TEXT
  `);

  // Allow the same email to have separate role-specific accounts/passwords.
  // Migrate existing databases away from the legacy email-only unique constraint.
  await pool.query(`
    ALTER TABLE auth_users DROP CONSTRAINT IF EXISTS auth_users_email_key;
    CREATE UNIQUE INDEX IF NOT EXISTS auth_users_email_role_unique
      ON auth_users(email, role)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_active
      ON password_reset_tokens(user_id, expires_at) WHERE used_at IS NULL
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agrochain_records (
      resource TEXT NOT NULL,
      id TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (resource, id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_agrochain_records_resource
    ON agrochain_records(resource)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgroChain API listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Could not start AgroChain API:', error.message);
  process.exitCode = 1;
});




