import * as XLSX from 'xlsx';

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string | number>[];
}

// CSV는 텍스트로 디코드해서 넘겨야 SheetJS가 구분자 파싱을 함 - ArrayBuffer 그대로
// 넘기면 바이너리 포맷(xlsx)으로 오인해 깨진 결과가 나온다.
export function parseSpreadsheet(buffer: ArrayBuffer, filename: string): ParsedSheet {
  const isCsv = filename.toLowerCase().endsWith('.csv');
  const workbook = isCsv
    ? XLSX.read(new TextDecoder('utf-8').decode(buffer), { type: 'string' })
    : XLSX.read(buffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('빈 파일입니다.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: '' });
  if (rows.length === 0) {
    throw new Error('데이터가 없습니다.');
  }

  return { headers: Object.keys(rows[0]), rows };
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer();
  return parseSpreadsheet(buffer, file.name);
}
