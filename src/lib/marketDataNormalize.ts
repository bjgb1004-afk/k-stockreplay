export type MarketField = 'date' | 'open' | 'high' | 'low' | 'close' | 'volume';

export interface ColumnMapping {
  date: string | null;
  open: string | null;
  high: string | null;
  low: string | null;
  close: string | null;
  volume: string | null;
}

export interface MarketDataRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const FIELD_ALIASES: Record<MarketField, string[]> = {
  date: ['날짜', '일자', '거래일', 'date'],
  open: ['시가', 'open'],
  high: ['고가', 'high'],
  low: ['저가', 'low'],
  close: ['종가', '현재가', 'close'],
  volume: ['거래량', 'volume'],
};

const FIELD_LABELS: Record<MarketField, string> = {
  date: '날짜',
  open: '시가',
  high: '고가',
  low: '저가',
  close: '종가',
  volume: '거래량',
};

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping = { date: null, open: null, high: null, low: null, close: null, volume: null } as ColumnMapping;

  for (const field of Object.keys(FIELD_ALIASES) as MarketField[]) {
    const aliases = FIELD_ALIASES[field].map((alias) => alias.toLowerCase());
    const match = headers.find((header) => aliases.includes(header.trim().toLowerCase()));
    mapping[field] = match ?? null;
  }

  return mapping;
}

// 증권사 파일은 숫자 셀에 천단위 콤마를 그대로 쓰는 경우가 많다 (예: "103,000").
function parseNumberCell(raw: string | number, rowNumber: number, field: MarketField): number {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      throw new Error(`${rowNumber}행: ${FIELD_LABELS[field]} 값이 숫자가 아닙니다.`);
    }
    return raw;
  }

  const cleaned = raw.replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  if (cleaned === '' || !Number.isFinite(parsed)) {
    throw new Error(`${rowNumber}행: ${FIELD_LABELS[field]} 값이 숫자가 아닙니다. (${raw})`);
  }
  return parsed;
}

const DATE_PATTERN = /^(\d{4})[-./]?(\d{2})[-./]?(\d{2})$/;

// Excel의 날짜 시리얼 번호(1899-12-30 기준 경과일)를 ISO 날짜로 변환한다.
function serialToIsoDate(serial: number): string {
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(ms).toISOString().slice(0, 10);
}

// 달력 상 존재하지 않는 조합(2월 30일 등)은 걸러내지 않는다 - 실제 증권사 데이터에서는
// 나오지 않고, 걸러내려면 별도 Date 왕복 검증이 필요해 여기서는 생략한다.
// ponytail: 월/일 범위만 확인, 윤년/월별 일수는 검증 안 함. 필요해지면 Date 왕복 검증 추가.
function parseDateCell(raw: string | number, rowNumber: number): string {
  if (typeof raw === 'number') {
    return serialToIsoDate(raw);
  }

  const match = DATE_PATTERN.exec(raw.trim());
  if (!match) {
    throw new Error(`${rowNumber}행: 날짜 형식을 인식할 수 없습니다. (${raw})`);
  }
  const [, year, month, day] = match;
  const monthNum = Number(month);
  const dayNum = Number(day);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    throw new Error(`${rowNumber}행: 날짜 형식을 인식할 수 없습니다. (${raw})`);
  }
  return `${year}-${month}-${day}`;
}

export function normalizeRows(
  rows: Record<string, string | number>[],
  mapping: ColumnMapping
): MarketDataRow[] {
  const missing = (Object.keys(mapping) as MarketField[]).filter((field) => mapping[field] === null);
  if (missing.length > 0) {
    throw new Error(`컬럼 매핑이 완료되지 않았습니다: ${missing.join(', ')}`);
  }

  return rows.map((row, index) => {
    const rowNumber = index + 1;
    const get = (field: MarketField) => row[mapping[field] as string];

    return {
      date: parseDateCell(get('date'), rowNumber),
      open: parseNumberCell(get('open'), rowNumber, 'open'),
      high: parseNumberCell(get('high'), rowNumber, 'high'),
      low: parseNumberCell(get('low'), rowNumber, 'low'),
      close: parseNumberCell(get('close'), rowNumber, 'close'),
      volume: parseNumberCell(get('volume'), rowNumber, 'volume'),
    };
  });
}
