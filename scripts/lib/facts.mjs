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

// DART re-files a revised report (e.g. "[기재정정]...") as a brand-new list
// entry each time - a single stock option grant can show up 5x in one day.
// Collapse same report_nm entries per ticker into one, keeping the latest
// (highest rcept_no) and tagging the title with the total count.
export function dedupeDisclosures(disclosures) {
  const groups = new Map();
  for (const d of disclosures) {
    const existing = groups.get(d.report_nm);
    if (!existing || d.rcept_no > existing.rcept_no) {
      groups.set(d.report_nm, { ...d, count: (existing?.count ?? 0) + 1 });
    } else {
      existing.count += 1;
    }
  }
  return [...groups.values()].map((d) => ({
    ...d,
    report_nm: d.count > 1 ? `${d.report_nm} (정정 등 ${d.count}건)` : d.report_nm,
  }));
}

export function levelFor(changeCount) {
  if (changeCount >= 3) return 'RED';
  if (changeCount >= 1) return 'ORANGE';
  return 'GREEN';
}

// changesByTicker: Map<ticker, { companyName, changeCount }>. Keyed by ticker (not
// companyName) so the client can join this feed against the local IndexedDB
// watchlist - which also keys by ticker - without fragile display-name matching.
export function buildMyStockRadar(changesByTicker) {
  return [...changesByTicker.entries()]
    .sort((a, b) => b[1].changeCount - a[1].changeCount)
    .map(([ticker, { companyName, changeCount }]) => ({
      ticker,
      companyName,
      changeCount,
      level: levelFor(changeCount),
    }));
}
