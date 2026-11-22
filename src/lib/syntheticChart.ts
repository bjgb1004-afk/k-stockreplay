import type { MarketDataRow } from './marketDataNormalize';

// 리플레이 방용 가상 차트. 실제 시세(금융위원회_주식시세정보)는 공공누리 제4유형
// (출처표시·상업적 이용금지·변경금지, 제3자 재배포 금지)이라 여러 사람에게 나눠 주는 게임에 쓸 수 없다.
// 그래서 방장이 정한 시드(seed) 하나로 모든 참가자의 브라우저가 똑같은 차트를 만들어 쓴다.
// 데이터 파일을 주고받지 않으므로 서버 비용도 없다.
//
// 진짜 같은 느낌을 위해 넣은 것 (주가 수익률의 널리 알려진 특성):
//  - 꼬리가 두꺼운 수익률 분포 (평소엔 잔잔하다가 가끔 크게)
//  - 변동성 뭉침 GARCH(1,1) + 하락 때 변동성이 더 커지는 레버리지 효과
//  - 수익률 자체는 예측이 거의 안 됨 (자기상관 ≈ 0)
//  - 상승·하락·횡보 국면 전환, 드문 급등락, 상·하한가 ±30%, 호가 단위 반올림
//  - 크게 움직인 날 거래량 증가, 거래량도 며칠씩 이어짐

// 시드 고정 난수 (mulberry32)
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// 국내 호가 단위 (2023년 이후 기준, 코스피·코스닥 공통)
export function tickSize(price: number): number {
  if (price < 2000) return 1;
  if (price < 5000) return 5;
  if (price < 20000) return 10;
  if (price < 50000) return 50;
  if (price < 200000) return 100;
  if (price < 500000) return 500;
  return 1000;
}

const roundTick = (p: number) => {
  const t = tickSize(p);
  return Math.max(t, Math.round(p / t) * t);
};

export function generateChart(seed: string, count: number): MarketDataRow[] {
  const r = rng(hashSeed(seed));
  const normal = () => {
    // Box-Muller
    const u = Math.max(1e-9, r());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  };
  // 꼬리가 두꺼운 분포(Student t, 자유도 4)를 분산 1로 맞춘 것 - 실제 주가처럼 "가끔 아주 크게" 움직이게 한다.
  const DF = 4;
  const fatTail = () => {
    let chi = 0;
    for (let i = 0; i < DF; i++) chi += normal() ** 2;
    return (normal() / Math.sqrt(chi / DF)) * Math.sqrt((DF - 2) / DF);
  };

  let price = roundTick(3000 + Math.exp(r() * Math.log(100)) * 2000); // 약 5천~20만 원대
  // GARCH(1,1) + 하락 시 변동성 더 커짐(레버리지 효과). 장기 평균 일간 변동성 1.6~3.6%.
  const longVol = 0.016 + r() * 0.02;
  const alpha = 0.08;
  const gamma = 0.06;
  const beta = 0.86;
  const omega = longVol ** 2 * (1 - alpha - gamma / 2 - beta);
  let var_ = longVol ** 2;
  let prevShock = 0;
  let drift = 0;
  let regimeLeft = 0;
  const baseLogVol = Math.log(50_000 + r() * 2_000_000);
  let volNoise = 0; // 거래량도 며칠씩 이어진다 (AR(1))

  // 날짜: 아무 해의 평일로 이어 붙인다 (실제 날짜와 무관).
  const d = new Date(Date.UTC(2015 + Math.floor(r() * 8), Math.floor(r() * 12), 1));
  const rows: MarketDataRow[] = [];

  for (let i = 0; i < count; i++) {
    do d.setUTCDate(d.getUTCDate() + 1);
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6);

    if (regimeLeft <= 0) {
      const k = r();
      drift = k < 0.35 ? 0.0015 + r() * 0.003 : k < 0.7 ? -(0.0015 + r() * 0.003) : (r() - 0.5) * 0.001;
      regimeLeft = 15 + Math.floor(r() * 45);
    }
    regimeLeft--;

    var_ = omega + alpha * prevShock ** 2 + (prevShock < 0 ? gamma * prevShock ** 2 : 0) + beta * var_;
    // 너무 잔잔해지거나(바닥) 너무 거칠어지지(천장) 않게 묶는다.
    const vol = Math.max(longVol * 0.6, Math.sqrt(Math.min(var_, 0.08 ** 2)));
    // 테마·뉴스성 급등락: 드물게 변동성의 3~6배 움직임
    const jump = r() < 0.012 ? (r() < 0.55 ? 1 : -1) * vol * (3 + r() * 3) : 0;
    const shock = fatTail() * vol + jump;
    prevShock = shock;
    const ret = Math.max(-0.3, Math.min(0.3, drift + shock));

    const prev = price;
    const close = roundTick(prev * (1 + ret));
    // 시가: 전날 종가 근처에서 출발하고, 하루 움직임의 일부가 장 시작 전에 반영된다.
    const open = roundTick(prev * (1 + Math.max(-0.29, Math.min(0.29, ret * (0.2 + r() * 0.3) + normal() * vol * 0.2))));
    const range = Math.abs(fatTail()) * vol * prev * 0.55;
    const high = roundTick(Math.min(prev * 1.3, Math.max(open, close) + range * r()));
    const low = roundTick(Math.max(prev * 0.7, Math.min(open, close) - range * r()));
    volNoise = volNoise * 0.7 + normal() * 0.35;
    const volume = Math.round(Math.exp(baseLogVol + volNoise + Math.min(2.2, 0.28 * (Math.abs(shock) / longVol))));

    rows.push({ date: d.toISOString().slice(0, 10), open, high: Math.max(high, open, close), low: Math.min(low, open, close), close, volume });
    price = close;
  }
  return rows;
}
