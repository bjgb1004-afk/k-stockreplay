import assert from 'node:assert/strict';
import { detectColumnMapping, normalizeRows } from './marketDataNormalize';

// 키움 헤더 자동 인식
{
  const mapping = detectColumnMapping(['일자', '시가', '고가', '저가', '현재가', '거래량']);
  assert.deepEqual(mapping, {
    date: '일자',
    open: '시가',
    high: '고가',
    low: '저가',
    close: '현재가',
    volume: '거래량',
  });
}

// 미래에셋 헤더 자동 인식 (종가 사용)
{
  const mapping = detectColumnMapping(['날짜', '시가', '고가', '저가', '종가', '거래량']);
  assert.equal(mapping.date, '날짜');
  assert.equal(mapping.close, '종가');
}

// 알 수 없는 헤더 -> 전부 null
{
  const mapping = detectColumnMapping(['Col1', 'Col2', 'Col3']);
  assert.deepEqual(mapping, {
    date: null,
    open: null,
    high: null,
    low: null,
    close: null,
    volume: null,
  });
}

const fullMapping = {
  date: '날짜',
  open: '시가',
  high: '고가',
  low: '저가',
  close: '종가',
  volume: '거래량',
};

// 정상 행: 콤마 포함 숫자 문자열 처리
{
  const rows = normalizeRows(
    [{ 날짜: '2026-08-28', 시가: '100,000', 고가: '105,000', 저가: '98,000', 종가: '103,000', 거래량: 1234567 }],
    fullMapping
  );
  assert.deepEqual(rows, [
    { date: '2026-08-28', open: 100000, high: 105000, low: 98000, close: 103000, volume: 1234567 },
  ]);
}

// 날짜 구분자 변형 처리 (yyyy.mm.dd, yyyymmdd)
{
  const rows = normalizeRows(
    [
      { 날짜: '2026.08.28', 시가: 1, 고가: 2, 저가: 1, 종가: 2, 거래량: 1 },
      { 날짜: '20260829', 시가: 1, 고가: 2, 저가: 1, 종가: 2, 거래량: 1 },
    ],
    fullMapping
  );
  assert.equal(rows[0].date, '2026-08-28');
  assert.equal(rows[1].date, '2026-08-29');
}

// Excel 날짜 시리얼 번호 -> ISO 날짜 (역산해서 왕복 검증)
{
  const referenceDate = '2026-08-28';
  const serial = Math.round(new Date(`${referenceDate}T00:00:00Z`).getTime() / 86400000) + 25569;
  const rows = normalizeRows(
    [{ 날짜: serial, 시가: 1, 고가: 2, 저가: 1, 종가: 2, 거래량: 1 }],
    fullMapping
  );
  assert.equal(rows[0].date, referenceDate);
}

// 매핑 미완성 -> 명확한 에러
{
  const incompleteMapping = { ...fullMapping, close: null };
  assert.throws(
    () => normalizeRows([{ 날짜: '2026-08-28', 시가: 1, 고가: 2, 저가: 1, 거래량: 1 }], incompleteMapping),
    /매핑.*완료되지 않았습니다.*close/
  );
}

// 숫자로 변환 안 되는 값 -> 행 번호 포함 에러
{
  assert.throws(
    () =>
      normalizeRows(
        [{ 날짜: '2026-08-28', 시가: 'abc', 고가: 2, 저가: 1, 종가: 2, 거래량: 1 }],
        fullMapping
      ),
    /1행.*시가/
  );
}

// 파싱 안 되는 날짜 -> 행 번호 포함 에러
{
  assert.throws(
    () =>
      normalizeRows(
        [{ 날짜: 'not-a-date', 시가: 1, 고가: 2, 저가: 1, 종가: 2, 거래량: 1 }],
        fullMapping
      ),
    /1행.*날짜/
  );
}

console.log('OK: marketDataNormalize selfcheck passed');
