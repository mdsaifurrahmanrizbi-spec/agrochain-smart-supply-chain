import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Hosted PostgreSQL providers such as Neon supply a connection URL.
// Keep the individual PG* settings as a fallback for local development.
export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || 'agrochain_db',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD,
        connectionTimeoutMillis: 5000,
      }
);

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});
