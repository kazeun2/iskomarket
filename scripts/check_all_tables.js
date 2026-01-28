/**
 * Check all tables and rows
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  const tables = ['messages', 'conversations', 'notifications', 'products', 'users'];

  for (const table of tables) {
    console.log(`\n=== ${table} ===`);
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(3);

      if (error) {
        console.log(`Error: ${error.message}`);
      } else {
        console.log(`Total rows: ${count}`);
        if (data && data.length > 0) {
          console.log(`Sample (first 3):`);
          console.log(data);
        }
      }
    } catch (err) {
      console.log(`Exception: ${err.message}`);
    }
  }
}

checkAllTables();
