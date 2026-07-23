import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

dotenv.config();

async function runTest() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ Supabase environment variables missing.');
    return;
  }

  const supabase = createClient(url, key);
  const todayKst = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date()).map(p => p.type !== 'literal' ? p.value : '').join('-');

  console.log(`📌 Today KST Date: ${todayKst}`);

  // 1. Verify kstock_platform_data table existence & UPSERT / SELECT
  console.log('\n--- Test 1: kstock_platform_data UPSERT & SELECT ---');
  const testKey = `morning_briefing_${todayKst}`;
  const testPayload = {
    date: todayKst,
    title: `[자동 테스트] ${todayKst} 장전 브리핑`,
    summary: '테스트 브리핑 요약 내용입니다.',
    timestamp: new Date().toISOString()
  };

  const { error: upsertError } = await supabase
    .from('kstock_platform_data')
    .upsert({
      key: testKey,
      data: testPayload,
      date_kst: todayKst,
      status: 'published',
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

  if (upsertError) {
    console.error('❌ UPSERT failed:', upsertError.message);
  } else {
    console.log('✅ UPSERT successful for key:', testKey);
  }

  // SELECT verification
  const { data: selectData, error: selectError } = await supabase
    .from('kstock_platform_data')
    .select('*')
    .eq('key', testKey)
    .single();

  if (selectError) {
    console.error('❌ SELECT failed:', selectError.message);
  } else {
    console.log('✅ SELECT successful:', {
      id: selectData.id,
      key: selectData.key,
      date_kst: selectData.date_kst,
      status: selectData.status,
      updated_at: selectData.updated_at
    });
  }

  // 2. Verify API endpoints locally (if server is running)
  console.log('\n--- Test 2: API Endpoint verification ---');
  try {
    const briefingRes = await fetch('http://localhost:3000/api/platform/briefing');
    if (briefingRes.ok) {
      const bJson: any = await briefingRes.json();
      console.log('✅ /api/platform/briefing response status 200. Data date:', bJson?.date || bJson?.data?.date || 'unknown');
    } else {
      console.log('⚠️ /api/platform/briefing status:', briefingRes.status);
    }
  } catch (err: any) {
    console.log('⚠️ Local server not running or unreachable:', err.message);
  }

  console.log('\n🎉 Pipeline verification tests completed!');
}

runTest().catch(console.error);
