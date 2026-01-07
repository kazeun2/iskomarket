/*
  Run a single SQL migration file against the test Supabase DB using service role key

  Usage:
    TEST_SUPABASE_URL=... TEST_SUPABASE_SERVICE_ROLE_KEY=... node scripts/run_migration_test_db.js migrations/20260108-drop-custom-title.sql
*/

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required Supabase service role credentials (TEST_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const migrationFile = process.argv[2] || process.env.MIGRATION_FILE || path.resolve(__dirname, '..', 'migrations', '20260108-drop-custom-title.sql');
if (!fs.existsSync(migrationFile)) {
  console.error('Migration file not found:', migrationFile);
  process.exit(1);
}

const sql = fs.readFileSync(migrationFile, 'utf8');
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function run() {
  console.log('Running migration file:', migrationFile);
  try {
    // Preferred: admin.rpc('sql') if helper function exists on the project
    const { data, error } = await admin.rpc('sql', { query: sql });
    if (!error) {
      console.log('Migration applied successfully via rpc("sql").');
      process.exit(0);
    }
    // If rpc is present but returned an error, we'll try a secondary approach below
    console.warn('admin.rpc("sql") returned error, attempting fallback:', error?.message || error);
  } catch (err) {
    console.warn('admin.rpc("sql") call failed or is not available:', err?.message || err);
  }

  // Fallback: try using the postgres.query API (available in newer supabase-js releases) when using service role
  try {
    if (typeof admin.postgres?.query === 'function') {
      console.log('Attempting migration via admin.postgres.query(...)');
      const { error } = await admin.postgres.query({ sql });
      if (error) {
        console.error('admin.postgres.query returned error:', error.message || error);
        process.exit(1);
      }
      console.log('Migration applied successfully via admin.postgres.query.');
      process.exit(0);
    }
  } catch (err) {
    console.warn('admin.postgres.query attempt failed or is not available:', err?.message || err);
  }

  // If we reach here we could not execute the SQL programmatically. Provide clear manual instructions.
  console.error('Unable to apply migration programmatically. Please apply the SQL file manually using your database admin tools (psql or Supabase SQL editor).');
  console.error('\nSuggested steps (psql):\n 1) Download the migration file:', migrationFile, "\n 2) Connect to your database and run:\n    psql <connection_string> -f '" + migrationFile + "'\n\nOr, open the Supabase Console SQL editor and paste the contents of the migration file and run it.\n");
  console.error('Migration SQL below:\n', sql);
  process.exit(1);
}

run();
