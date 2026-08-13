// Pure helpers for the FACT ENGINE pipeline - no network/filesystem I/O so they're
// testable without a DART_API_KEY. See scripts/fetch-facts.mjs for the pipeline
// that calls these.

// report_nm keyword -> today.json `type` (checked in order, first match wins).
export const CLASSIFY_RULES = [
  [/배당/, 'DIVIDEND'],
  [/공급계약|공급 계약|계약체결|계약 체결/, 'CONTRACT'],
  [/대표이사|임원.*변경|사내이사/, 'MANAGEMENT_CHANGE'],
  // 임원ㆍ주요주주 지분 변동, 5%룰 대량보유 - "내부자 매매" 신호. 다른 데선 잘
  // 안 챙겨보는, 이 앱이 실제로 차별화될 수 있는 정보라 별도 타입으로 뗀다.
  [/특정증권등소유상황보고서|주식등의대량보유상황보고서/, 'INSIDER'],
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

// report_nm(공시 제목)을 그대로 보여주면 트레이더가 매번 법률 문장을 해석해야
// 한다 - 규칙 기반(§AI 미사용 원칙)으로 "무슨 뜻인지"를 평문으로 번역하고,
// 제목만으로 방향(호재/악재)이 확정되는 것만 sentiment를 매긴다. 대부분의 DART
// 표준 서식(매출액변경, 소송판결 등)은 제목에 증감/승패가 없으므로 억지로 방향을
// 만들지 않고 MIXED로 "원문 확인 필요"라고 정직하게 알린다.
export const INTERPRET_RULES = [
  // 명확히 부정적
  [/부도(발생|미확인)/, 'NEGATIVE', '부도 발생 - 매우 부정적인 신호'],
  [/해산\s*사유\s*발생/, 'NEGATIVE', '회사 해산 사유 발생 - 매우 부정적인 신호'],
  [/영업정지/, 'NEGATIVE', '영업 정지 - 사업 중단 관련, 부정적인 신호'],
  [/회생절차\s*개시/, 'NEGATIVE', '법정관리(회생절차) 개시 - 매우 부정적인 신호'],
  [/파산/, 'NEGATIVE', '파산 관련 공시 - 매우 부정적인 신호'],
  [/상장\s*폐지/, 'NEGATIVE', '상장폐지 관련 - 매우 부정적인 신호'],
  [/상장적격성\s*실질심사/, 'NEGATIVE', '상장 적격성 심사 대상 - 상장폐지로 이어질 수 있는 부정적 신호'],
  // DART 표준 서식명은 "반기검토(감사)의견부적정등사실확인"처럼 "감사"와 "의견" 사이에
  // 괄호가 끼어있어서 "감사의견"으로 붙여 찾으면 못 잡는다 - "의견" 뒤 판정어만 본다.
  [/의견\s*(거절|부적정|한정)/, 'NEGATIVE', '감사의견 비적정 - 회계 신뢰성에 대한 매우 부정적인 신호'],
  [/(불성실\s*공시|공시\s*위반)/, 'NEGATIVE', '불성실공시 관련 제재 - 부정적인 신호'],
  [/관리종목/, 'NEGATIVE', '관리종목 지정 관련 - 부정적인 신호'],
  [/채권은행.*관리절차/, 'NEGATIVE', '채권단 관리절차 관련 - 부정적인 신호'],
  [/(단일판매|공급계약).*해지/, 'NEGATIVE', '공급계약 해지 - 매출 감소 관련 부정적 신호'],

  // 명확히 긍정적
  [/무상증자\s*결정/, 'POSITIVE', '무상증자 결정 - 대체로 주가에 긍정적으로 받아들여짐'],
  [/자기주식\s*취득\s*결정/, 'POSITIVE', '자사주 매입 결정 - 대체로 주가 부양 목적의 긍정적 신호'],
  [/자기주식\s*소각/, 'POSITIVE', '자사주 소각 결정 - 주주가치 제고 목적의 긍정적 신호'],
  [/특별\s*(현금|주식)\s*배당/, 'POSITIVE', '특별배당 결정 - 긍정적인 신호'],
  [/(단일판매|공급계약).*체결/, 'POSITIVE', '공급계약 체결 - 매출 확대 관련 긍정적 신호(전체 매출 대비 규모는 원문 확인 필요)'],
  [/현금.*배당\s*결정|현물.*배당\s*결정/, 'POSITIVE', '배당 결정 - 주주환원 관련 긍정적 신호'],

  // 제목만으로는 방향(호재/악재)이 안 정해짐 - 원문 확인 필요
  [/매출액(또는|이나)?\s*손익구조.*(변경|변동)/, 'MIXED', '실적(매출/손익) 변동 공시 - 증가인지 감소인지는 원문 확인 필요'],
  [/소송.*(판결|결정)/, 'MIXED', '소송 판결/결정 공시 - 승소인지 패소인지는 원문 확인 필요'],
  [/(유상증자|전환사채|신주인수권부사채).*결정/, 'MIXED', '자금조달(증자/CB/BW) 결정 - 주식 물량 증가로 단기 악재일 수 있으나 조달 목적에 따라 다름'],
  [/감자\s*결정/, 'MIXED', '감자 결정 - 무상감자는 통상 악재, 재무구조 개선 목적이면 다르게 해석될 수 있음'],
  [/최대주주\s*변경/, 'MIXED', '최대주주 변경 - 경영권 이슈, 배경 확인 필요'],
  [/(대표이사|대표집행임원).*변경/, 'MIXED', '대표이사 변경 - 배경에 따라 호재/악재가 갈림'],
  [/타법인.*(주식|출자증권).*취득/, 'MIXED', '타법인 지분 취득 - M&A·투자 목적에 따라 다름'],
  [/영업(양수|양도)/, 'MIXED', '영업 양수도 - 사업 구조 변화, 배경 확인 필요'],
  [/(회사\s*)?분할\s*결정/, 'MIXED', '회사 분할 결정 - 목적에 따라 다름'],
  [/합병\s*결정/, 'MIXED', '합병 결정 - 목적/비율에 따라 다름'],
  [/담보\s*제공/, 'MIXED', '담보 제공 결정 - 자금조달 관련, 배경 확인 필요'],
  [/채무\s*보증/, 'MIXED', '채무보증 결정 - 계열사 지원 관련, 배경 확인 필요'],

  [/임원.*주요주주.*소유상황|특정증권등소유상황보고서/, 'MIXED', '임원ㆍ주요주주 지분 변동 보고 - 매수/매도 여부ㆍ수량은 원문 확인 필요, 내부자 동향 신호'],
  [/주식등의대량보유상황보고서/, 'MIXED', '5% 이상 대량보유 상황 보고 - 지분 확대/축소 여부는 원문 확인 필요'],

  // 행정성/기타 - 방향성 없음
  [/기업설명회|IR\s*개최/, 'NEUTRAL', 'IR(기업설명회) 개최 안내 - 행정성 공시'],
  [/기타시장안내/, 'NEUTRAL', '거래소 시장 안내 공시'],
  [/지급수단.*지급기간.*분쟁조정/, 'NEUTRAL', '전자금융거래 관련 정기 안내 공시 - 행정성'],
  [/주식매수선택권.*부여/, 'NEUTRAL', '스톡옵션 부여 공시 - 임직원 보상 관련'],
];

export function interpret(reportName) {
  for (const [pattern, sentiment, meaning] of INTERPRET_RULES) {
    if (pattern.test(reportName)) return { sentiment, meaning };
  }
  return { sentiment: 'NEUTRAL', meaning: '공시 원문 확인이 필요합니다.' };
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
