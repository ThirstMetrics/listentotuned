import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

async function migrate(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
  });

  try {
    const schemaPath = path.resolve(__dirname, '../models/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('[Migrate] Running schema migration...');
    await pool.query(schema);
    console.log('[Migrate] Schema migration completed successfully');
  } catch (err) {
    console.error('[Migrate] Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
