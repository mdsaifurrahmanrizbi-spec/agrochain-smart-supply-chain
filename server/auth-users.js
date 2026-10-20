import 'dotenv/config';
import { pool } from './db.js';
import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';
import prompts from 'prompts';
import { stdin, stdout } from 'node:process';
import { randomUUID } from 'node:crypto';

const rl = createInterface({ input: stdin, output: stdout });

async function readHidden(prompt) {
  const response = await prompts({
    type: 'password',
    name: 'value',
    message: prompt,
    validate: value => value.length >= 12 || 'Password must be at least 12 characters',
  });

  if (typeof response.value !== 'string') {
    throw new Error('Password input cancelled');
  }

  return response.value;
}
async function main() {
  const email = (await rl.question('Admin email: ')).trim().toLowerCase();
  const name = (await rl.question('Admin full name: ')).trim();
  rl.close();
  const password = await readHidden('Admin password (hidden, 12+ chars): ');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address');
  }
  if (!name || password.length < 12) {
    throw new Error('Name is required; password must be at least 12 characters');
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

  const existing = await pool.query(
    'SELECT id FROM auth_users WHERE email = $1',
    [email]
  );
  if (existing.rowCount) {
    throw new Error('That email already exists; no account was changed');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO auth_users (id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')`,
    [`usr_${randomUUID()}`, name, email, passwordHash]
  );

  console.log('Admin account created. No plaintext password was stored.');
}

main()
  .catch((error) => {
    console.error('Admin bootstrap failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    stdin.setRawMode?.(false);
    await pool.end();
  });



