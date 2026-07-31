
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const date = '2026-07-31';
  console.log(`Checking data for date: ${date}`);

  const keys = [
    `morning_briefing_${date}`,
    `afternoon_report_${date}`,
    `jodoju_list_${date}`,
    `insight_column_${date}_1200`,
    `insight_column_${date}_2000`
  ];

  for (const key of keys) {
    const { data, error } = await supabase
      .from('kstock_platform_data')
      .select('key, date_kst, data')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.log(`[${key}] Error: ${error.message}`);
    } else if (data) {
      const summary = data.data?.summary || data.data?.marketAnalysisSummary || 
                      (data.data?.stocks ? `${data.data.stocks.length} stocks` : null) ||
                      (data.data?.content ? data.data.content.slice(0, 50) + '...' : 'No content');
      console.log(`[${key}] EXISTS (date_kst: ${data.date_kst}) | Content: ${summary}`);
    } else {
      console.log(`[${key}] MISSING`);
    }
  }

  // Check general keys
  const generalKeys = ['morning_briefing', 'afternoon_report', 'market_leading_stocks'];
  for (const key of generalKeys) {
    const { data, error } = await supabase
      .from('kstock_platform_data')
      .select('key, date_kst, data')
      .eq('key', key)
      .eq('date_kst', date)
      .maybeSingle();

    if (data) {
      console.log(`[${key} (general)] EXISTS for ${date}`);
    } else {
      console.log(`[${key} (general)] MISSING for ${date}`);
    }
  }
}

check();
