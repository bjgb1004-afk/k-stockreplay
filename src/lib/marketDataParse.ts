import * as XLSX from 'xlsx';
import * as cptable from 'xlsx/dist/cpexcel.full.mjs';

// ESM 빌드(xlsx.mjs)는 번들 크기 때문에 codepage 테이블을 기본 로드하지 않는다 -
// 등록 안 하면 codepage: 949를 넘겨도 조용히 무시되고 CP949 문자열이 계속 깨진다.
// set_cptable은 {cptable, utils} 모듈 객체 전체를 요구한다(utils.decode를 내부에서 씀).
XLSX.set_cptable(cptable);

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string | number>[];
}

// 한국 증권사 HTS가 뽑는 CSV/구형 XLS는 UTF-8이 아니라 CP949(EUC-KR)로 인코딩된
// 경우가 흔하다. UTF-8로 먼저 엄격 디코드를 시도해 실패하면 CP949로 재시도한다.
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('euc-kr').decode(buffer);
  }
}

// CSV는 텍스트로 디코드해서 넘겨야 SheetJS가 구분자 파싱을 함 - ArrayBuffer 그대로
// 넘기면 바이너리 포맷(xlsx)으로 오인해 깨진 결과가 나온다.
//
// 구형 .xls(BIFF)는 내부 CodePage 레코드가 없거나 SheetJS가 인식 못 하면 CP949
// 문자열이 깨져서 나온다(예: "일자" -> "ÀÏÀÚ") - codepage: 949를 명시해 강제한다.
// XLSX(OOXML)는 항상 UTF-8이라 이 옵션은 무시되므로 안전하다.
export function parseSpreadsheet(buffer: ArrayBuffer, filename: string): ParsedSheet {
  const isCsv = filename.toLowerCase().endsWith('.csv');
  const workbook = isCsv
    ? XLSX.read(decodeText(buffer), { type: 'string' })
    : XLSX.read(buffer, { type: 'array', codepage: 949 });

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
