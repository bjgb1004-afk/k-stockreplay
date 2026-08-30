import assert from 'node:assert/strict';
import { parseSpreadsheet } from './marketDataParse';

function bufferFrom(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

// 정상 CSV: 헤더 + row 파싱 확인
{
  const csv = '날짜,시가,고가,저가,종가,거래량\n2026-08-28,100000,105000,98000,103000,1234567\n';
  const result = parseSpreadsheet(bufferFrom(csv), 'test.csv');
  assert.deepEqual(result.headers, ['날짜', '시가', '고가', '저가', '종가', '거래량']);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0]['종가'], 103000);
}

// 빈 파일: 명확한 에러
{
  assert.throws(() => parseSpreadsheet(bufferFrom(''), 'empty.csv'), /데이터가 없습니다/);
}

console.log('OK: marketDataParse selfcheck passed');
