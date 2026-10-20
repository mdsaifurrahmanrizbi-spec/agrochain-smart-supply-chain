import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const secret = process.env.JWT_SECRET;

export function createAuthToken(user) {
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is missing or too short');
  }

  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    secret,
    { expiresIn: '8h', issuer: 'agrochain-api' }
  );
}

export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!secret || secret.length < 32) {
    return res.status(503).json({ message: 'Authentication is not configured' });
  }

  let claims;

  try {
    claims = jwt.verify(match[1], secret, {
      issuer: 'agrochain-api',
      algorithms: ['HS256'],
    });
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  if (
    !claims ||
    typeof claims !== 'object' ||
    typeof claims.sub !== 'string' ||
    typeof claims.role !== 'string'
  ) {
    return res.status(401).json({ message: 'Invalid token claims' });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, role, status
       FROM auth_users
       WHERE id = $1`,
      [claims.sub]
    );

    const account = result.rows[0];

    if (
      !account ||
      account.status !== 'ACTIVE' ||
      account.role !== claims.role
    ) {
      return res.status(401).json({
        message: 'Account is inactive or the session is no longer valid',
      });
    }

    req.auth = {
      sub: account.id,
      role: account.role,
      email: account.email,
    };

    return next();
  } catch (error) {
    console.error('Authentication account check failed:', error.message);
    return res.status(503).json({
      message: 'Authentication could not be verified',
    });
  }
}
