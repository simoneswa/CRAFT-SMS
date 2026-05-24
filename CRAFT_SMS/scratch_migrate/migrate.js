process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const { Client } = require('pg');

// Using the DIRECT_URL from .env which runs on port 5432 (Session Mode) required for DDL operations
const connectionString = "postgresql://postgres.rddopumvwsmetvrtotun:WGoakNHjHt7z9UaI@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require";

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[*] Connected to Supabase Postgres (Direct Mode - Port 5432).');

    // Read the schema.sql file
    const schemaSql = fs.readFileSync('../backend/supabase/schema.sql', 'utf8');
    
    console.log('[*] Executing backend/supabase/schema.sql...');
    // We can run the entire file as a single query
    await client.query(schemaSql);
    
    console.log('[+] Migration executed successfully! All tables and RLS policies have been populated.');
  } catch (err) {
    console.error('[-] Migration failed:', err);
  } finally {
    await client.end();
    console.log('[*] Database connection closed.');
  }
}

runMigration();
