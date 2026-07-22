import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;

  const supabase = createClient(url, key);

  const tablesToCheck = [
    'kstock_platform_data',
    'daily_market_briefing',
    'kstock_leaderboard',
    'posts',
    'insight_columns'
  ];

  console.log('--- Checking Table Existence ---');
  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`Table '${table}': NOT FOUND or ERROR:`, error.message);
    } else {
      console.log(`Table '${table}': EXISTS! (Retrieved ${data.length} rows)`);
    }
  }
}

run();
