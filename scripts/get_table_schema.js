/**
 * Get detailed messages table schema from Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableSchema() {
  try {
    // Query the information_schema
    const { data, error } = await supabase
      .from('information_schema_columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'messages')
      .eq('table_schema', 'public');

    if (error) {
      console.log('Could not query information_schema, trying direct table inspection...');
      
      // Fallback: try to select from messages with no rows
      const { data: test, error: testError } = await supabase
        .from('messages')
        .select()
        .limit(0);
      
      if (testError) {
        console.log('Messages table error:', testError);
      } else {
        console.log('Messages table exists but is empty');
      }
    } else {
      console.log('Messages table columns:');
      console.log(data);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

getTableSchema();
