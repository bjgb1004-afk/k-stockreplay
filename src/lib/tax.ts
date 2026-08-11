// 배당소득세 14% + 지방소득세 1.4% = 15.4% 원천징수 - 국내 상장주식 배당의
// 표준 세율(잘 알려진 공개 정보, 개별 세무 상황에 따라 다를 수 있는 추정치).
// 금융소득 2,000만원 초과 시 종합과세 대상이 될 수 있음 - 그런 세부 세무
// 시뮬레이션까지는 스코프 밖, 원천징수 기준 추정치만 보여준다.
export const DIVIDEND_WITHHOLDING_TAX_RATE = 0.154;

export function afterTax(grossAmount: number): number {
  return Math.round(grossAmount * (1 - DIVIDEND_WITHHOLDING_TAX_RATE));
}
