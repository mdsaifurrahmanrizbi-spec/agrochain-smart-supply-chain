
import 'dotenv/config';
import express from 'express';
import { pool } from './db.js';
import bcrypt from 'bcryptjs';
import { createAuthToken, requireAuth } from './auth.js';

const app = express();
const PORT = Number(process.env.PORT || 8000);

app.use(express.json({ limit: '1mb' }));

// Set CORS_ORIGINS to comma-separated deployed frontend origins in production.
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
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
  'GET, POST, PUT, DELETE, OPTIONS'
);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

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
      'SELECT id FROM auth_users WHERE email = $1',
      [email]
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
       FROM auth_users WHERE email = $1`,
      [email]
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
  codRecords: ['admin'],
  settlements: ['admin'],
  trackingEvents: ['admin', 'buyer', 'delivery', 'warehouse', 'inspector'],
  godowns: ['admin', 'warehouse'],
  godownShipments: ['admin', 'delivery', 'warehouse'],
};

function canReadResource(role, resource) {
  if (['users', 'codRecords', 'settlements'].includes(resource)) return role === 'admin';
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

    res.json(result.rows);
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

    // Payment fields must only be changed by a dedicated server-side payment flow.
    if (resource === 'orders') {
      const protectedPaymentFields = [
        'paymentStatus',
        'paymentMethod',
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




