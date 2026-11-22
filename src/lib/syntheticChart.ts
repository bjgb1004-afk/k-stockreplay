import type { MarketDataRow } from './marketDataNormalize';

// 리플레이 방용 가상 차트. 실제 시세(금융위원회_주식시세정보)는 공공누리 제4유형
// (출처표시·상업적 이용금지·변경금지, 제3자 재배포 금지)이라 여러 사람에게 나눠 주는 게임에 쓸 수 없다.
// 그래서 방장이 정한 시드(seed) 하나로 모든 참가자의 브라우저가 똑같은 차트를 만들어 쓴다.
// 데이터 파일을 주고받지 않으므로 서버 비용도 없다.
//
// 진짜 같은 느낌을 위해 넣은 것: 상승·하락·횡보 국면 전환, 변동성 뭉침(큰 움직임 뒤 큰 움직임),
// 가끔 나오는 갭, 상·하한가(±30%), 호가 단위 반올림, 움직임이 클수록 늘어나는 거래량.

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

  let price = roundTick(3000 + Math.exp(r() * Math.log(100)) * 2000); // 약 5천~20만 원대
  let vol = 0.015 + r() * 0.02; // 일간 변동성 1.5~3.5%
  let drift = 0;
  let regimeLeft = 0;
  const baseVolume = Math.round(50_000 + r() * 2_000_000);

  // 날짜: 아무 해의 평일로 이어 붙인다 (실제 날짜와 무관).
  const d = new Date(Date.UTC(2015 + Math.floor(r() * 8), Math.floor(r() * 12), 1));
  const rows: MarketDataRow[] = [];

  for (let i = 0; i < count; i++) {
    do d.setUTCDate(d.getUTCDate() + 1);
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6);

    if (regimeLeft <= 0) {
      const k = r();
      drift = k < 0.35 ? 0.002 + r() * 0.004 : k < 0.7 ? -(0.002 + r() * 0.004) : (r() - 0.5) * 0.001;
      regimeLeft = 15 + Math.floor(r() * 45);
    }
    regimeLeft--;

    const prev = price;
    const gap = r() < 0.03 ? (r() < 0.5 ? -1 : 1) * (0.03 + r() * 0.1) : normal() * vol * 0.25;
    const open = roundTick(prev * (1 + Math.max(-0.29, Math.min(0.29, gap))));
    let ret = drift + normal() * vol;
    ret = Math.max(-0.3, Math.min(0.3, (open / prev - 1) + ret * 0.8));
    const close = roundTick(prev * (1 + ret));
    const span = Math.abs(normal()) * vol * prev * 0.6;
    const high = roundTick(Math.min(prev * 1.3, Math.max(open, close) + span * r()));
    const low = roundTick(Math.max(prev * 0.7, Math.min(open, close) - span * r()));
    const volume = Math.round(baseVolume * Math.exp(normal() * 0.35) * (1 + 12 * Math.abs(ret)));

    rows.push({ date: d.toISOString().slice(0, 10), open, high: Math.max(high, open, close), low: Math.min(low, open, close), close, volume });
    price = close;
    // 변동성 뭉침: 크게 움직인 날 다음엔 변동성이 커지고, 천천히 평균으로 돌아온다.
    vol = Math.max(0.008, Math.min(0.06, vol * 0.94 + Math.abs(ret) * 0.12 + 0.0012));
  }
  return rows;
}
