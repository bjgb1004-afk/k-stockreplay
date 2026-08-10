// Pure helpers for the FACT ENGINE pipeline - no network/filesystem I/O so they're
// testable without a DART_API_KEY. See scripts/fetch-facts.mjs for the pipeline
// that calls these.

// report_nm keyword -> today.json `type` (checked in order, first match wins).
export const CLASSIFY_RULES = [
  [/배당/, 'DIVIDEND'],
  [/공급계약|공급 계약|계약체결|계약 체결/, 'CONTRACT'],
  [/대표이사|임원.*변경|사내이사/, 'MANAGEMENT_CHANGE'],
];

export function classify(reportName) {
  for (const [pattern, type] of CLASSIFY_RULES) {
    if (pattern.test(reportName)) return type;
  }
  return 'DISCLOSURE';
}

export function levelFor(changeCount) {
  if (changeCount >= 3) return 'RED';
  if (changeCount >= 1) return 'ORANGE';
  return 'GREEN';
}

export function buildMyStockRadar(changesByTicker) {
  return [...changesByTicker.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([companyName, changeCount]) => ({ companyName, changeCount, level: levelFor(changeCount) }));
}
