
import 'dotenv/config';
import express from 'express';
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

  const allowedRegistrationRoles = new Set(['farmer', 'buyer', 'delivery']);

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

  const status = requestedRole === 'delivery' ? 'PENDING' : 'ACTIVE';

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

    return res.status(201).json({
      message: requestedRole === 'delivery'
        ? 'Delivery Partner application submitted. You can log in after an administrator approves your account.'
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
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254) {
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
      const resetUrl = frontend + '/password-reset?token=' + encodeURIComponent(rawToken);
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
      `SELECT id, name, email, password_hash, role, status, created_at
       FROM auth_users WHERE email = $1 AND role = $2`,
      [email, requestedRole]
    );
    const account = result.rows[0];

    // Do not disclose whether an account exists until its password is verified.
    if (!account || !(await bcrypt.compare(password, account.password_hash))) {
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

// Return the authenticated account from the database.
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, status, created_at FROM auth_users WHERE id = $1', [req.auth.sub]);
    const account = result.rows[0];
    if (!account || account.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Account is inactive or unavailable' });
    }
    return res.json({
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      status: account.status,
      createdAt: account.created_at,
    });
  } catch (error) {
    console.error('Current-user lookup failed:', error.message);
    return res.status(503).json({ message: 'Could not verify current account' });
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
  qualityChecks: ['admin', 'inspector', 'warehouse'],
  codRecords: ['admin', 'warehouse', 'delivery'],
  settlements: ['admin'],
  trackingEvents: ['admin', 'buyer', 'delivery', 'warehouse', 'inspector'],
  godowns: ['admin', 'warehouse'],
  godownShipments: ['admin', 'delivery', 'warehouse'],
};

function canReadResource(role, resource) {
  if (['users', 'settlements'].includes(resource)) return role === 'admin';
  if (resource === 'codRecords') return ['admin', 'warehouse'].includes(role);
  return allowedResources.has(resource);
}

function canWriteResource(role, resource) {
  return resourceWriteRoles[resource]?.includes(role) === true;
}

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
          row.data?.deliveryPartnerId === req.auth.sub ||
          row.data?.pickupPartnerId === req.auth.sub
        );
      }
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

  if (!canWriteResource(role, resource)) {
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

    if (resource === 'codRecords' && role === 'warehouse') {
      const immutableFields = ['orderId', 'orderNumber', 'deliveryPartnerId', 'deliveryPartnerName', 'amount', 'collectedAt'];
      if (!existing || data.depositStatus !== 'CASH_DEPOSIT_VERIFIED' ||
          existing.depositStatus === 'CASH_DEPOSIT_VERIFIED' ||
          immutableFields.some((field) => data[field] !== existing[field])) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Warehouse managers may only verify an existing COD deposit once, without changing its transaction details' });
      }

      const orderResult = await client.query(
        "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1 FOR UPDATE",
        [existing.orderId]
      );
      const relatedOrder = orderResult.rows[0]?.data;
      if (!relatedOrder || relatedOrder.paymentMethod !== 'COD' ||
          relatedOrder.orderStatus !== 'DELIVERED' || relatedOrder.isDeliveryVerified !== true) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'COD deposit can only be verified after delivery is confirmed' });
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
        /quality\s*inspector|inspector|agronomist/i.test(data.actorRole);

      if (claimsQcDecision || claimsInspectorIdentity) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          message: 'Only an admin or quality inspector may create QC-related tracking events',
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
    const finalQcStatuses = ['APPROVED', 'REJECTED'];

    if (
      resource === 'qualityChecks' &&
      privilegedQcRoles.includes(role) &&
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
      privilegedQcRoles.includes(role) &&
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
      !privilegedQcRoles.includes(role) &&
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
      !privilegedQcRoles.includes(role) &&
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




