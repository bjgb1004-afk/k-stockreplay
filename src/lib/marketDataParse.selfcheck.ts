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

// CP949(EUC-KR)로 인코딩된 CSV (증권사 HTS 기본 인코딩) - UTF-8로 강제 디코드하면
// 헤더가 깨져서 컬럼 매핑이 통째로 실패한다. "날짜,시가\n2026-08-28,100000\n"을
// PowerShell [Text.Encoding]::GetEncoding(949)로 실제 인코딩해서 얻은 바이트.
{
  const cp949Bytes = new Uint8Array([
    179, 175, 194, 165, 44, 189, 195, 176, 161, 10, 50, 48, 50, 54, 45, 48, 56, 45, 50, 56, 44, 49, 48, 48, 48, 48,
    48, 10,
  ]);
  const result = parseSpreadsheet(cp949Bytes.buffer, 'hts-export.csv');
  assert.deepEqual(result.headers, ['날짜', '시가']);
  assert.equal(result.rows[0]['시가'], 100000);
}

console.log('OK: marketDataParse selfcheck passed');
