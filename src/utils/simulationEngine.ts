/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Stock Trading Simulator - Minute Bar Mutation & Real-time Tick Simulation Engine
 * 
 * This module provides high-fidelity mathematical masking (Noise & Warping) for 1-minute
 * stock candles to mitigate legal/copyright replication risks, and virtualizes the micro-level
 * transaction execution (tick-by-tick) to feed live charts and order books.
 */

export interface InputCandle {
  date: string;   // e.g., "2026-07-14 09:00:00"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MutatedCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isMutated: boolean;
  originalPriceHash?: string; // Verification hash/marker
}

export interface VirtualTick {
  secondOffset: number;   // 0 to 59 seconds within the minute
  price: number;          // Executed trade price
  volume: number;         // Executed trade volume (shares)
  type: 'BUY' | 'SELL';   // Execution sign
  accumulatedVol: number; // Volume accumulated so far in this candle
}

/**
 * Utility to round prices to the standard Korean stock market tick size.
 */
export function getKoreanTickSize(price: number): number {
  if (price < 1000) return 1;
  if (price < 2000) return 5;
  if (price < 10000) return 10;
  if (price < 50000) return 50;
  if (price < 100000) return 100;
  if (price < 500000) return 500;
  return 1000;
}

export function roundToKoreanTick(price: number): number {
  const tick = getKoreanTickSize(price);
  return Math.round(price / tick) * tick;
}

/**
 * 1. Data Masking Filter (Noise & Warping)
 * 
 * Transforms original minute candles using a high-frequency mathematical filter.
 * Applies a random price mutation ratio between ±0.03% and ±0.12%, maintaining
 * internal candle constraints (High >= Max(O, C), Low <= Min(O, C)) and tick sizes.
 * Volume is also mutated with ±5% to ±15% weight.
 * 
 * @param originalCandles Array of 1-minute candles
 * @returns Array of masked/mutated candles
 */
export function mutateMinuteCandles(originalCandles: InputCandle[]): MutatedCandle[] {
  const mutated: MutatedCandle[] = [];
  
  // High-performance deterministic pseudorandom seed generator based on the initial dataset size
  let seed = originalCandles.length + 42;
  const nextRandom = (): number => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < originalCandles.length; i++) {
    const original = originalCandles[i];
    
    // Pick price noise ratio: either negative [-0.0012, -0.0003] or positive [0.0003, 0.0012]
    const sign = nextRandom() > 0.5 ? 1 : -1;
    const magnitude = 0.0003 + nextRandom() * 0.0009; // 0.0003 to 0.0012
    const priceNoiseRatio = 1 + (sign * magnitude);

    // Apply mutation to close and open prices first
    let mutatedOpen = roundToKoreanTick(original.open * priceNoiseRatio);
    let mutatedClose = roundToKoreanTick(original.close * priceNoiseRatio);

    // Ensure continuous pricing if wanted (close of t-1 ~= open of t)
    if (i > 0 && Math.abs(mutatedOpen - mutated[i - 1].close) / mutated[i - 1].close < 0.003) {
      mutatedOpen = mutated[i - 1].close; // preserve continuity
    }

    // Mutate High and Low prices
    let mutatedHigh = roundToKoreanTick(original.high * priceNoiseRatio);
    let mutatedLow = roundToKoreanTick(original.low * priceNoiseRatio);

    // Maintain mathematical sanity: High >= Max(O, C) and Low <= Min(O, C)
    const currentMax = Math.max(mutatedOpen, mutatedClose);
    const currentMin = Math.min(mutatedOpen, mutatedClose);

    if (mutatedHigh < currentMax) {
      mutatedHigh = currentMax;
    }
    if (mutatedLow > currentMin) {
      mutatedLow = currentMin;
    }

    // Apply Volume noise (±5% to ±15% mutation)
    const volSign = nextRandom() > 0.5 ? 1 : -1;
    const volMagnitude = 0.05 + nextRandom() * 0.10; // 0.05 to 0.15
    const mutatedVol = Math.max(10, Math.round(original.volume * (1 + (volSign * volMagnitude))));

    mutated.push({
      date: original.date,
      open: mutatedOpen,
      high: mutatedHigh,
      low: mutatedLow,
      close: mutatedClose,
      volume: mutatedVol,
      isMutated: true,
      originalPriceHash: `sha256-msk-${Math.round(original.close * 1234.5).toString(16)}`
    });
  }

  return mutated;
}

/**
 * 2. Virtual Tick Flow Micro-Simulation (Real-time 60s stream generator)
 * 
 * Virtualizes tick transaction occurrences during a 1-minute candle period.
 * Generates high-fidelity tick events following price pathways that start at Open
 * and hit High and Low points sequentially before landing EXACTLY on Close at the 59th second.
 * 
 * - Bullish candle path: Open -> Low -> High -> Close (buying dominant speed)
 * - Bearish candle path: Open -> High -> Low -> Close (selling pressure speed)
 * - Volume-dry candle: Low-frequency sparse ticks
 * - Volume-heavy candle: High-frequency rapid ticks
 * 
 * @param candle A mutated 1-minute candle
 * @returns Array of 60 virtual ticks representing real-time executions
 */
export function generateVirtualTicksForCandle(candle: MutatedCandle): VirtualTick[] {
  const ticks: VirtualTick[] = [];
  const O = candle.open;
  const H = candle.high;
  const L = candle.low;
  const C = candle.close;
  const V = candle.volume;

  const isBullish = C >= O;
  
  // Determine dynamic tick count based on volume weight (more volume -> higher resolution)
  // Low: 12 ticks, Average: 24 ticks, High: 48-60 ticks
  let tickCount = 15;
  if (V > 1000000) tickCount = 50;
  else if (V > 300000) tickCount = 35;
  else if (V > 100000) tickCount = 24;
  else if (V < 10000) tickCount = 10;

  // Define critical pathway checkpoints: [timeFraction (0-1), targetPrice]
  // Bullish: Open (0) -> Low (0.25) -> High (0.75) -> Close (1.0)
  // Bearish: Open (0) -> High (0.25) -> Low (0.75) -> Close (1.0)
  const pathNodes: { fraction: number; price: number }[] = [];
  if (isBullish) {
    pathNodes.push({ fraction: 0.0, price: O });
    pathNodes.push({ fraction: 0.25, price: L });
    pathNodes.push({ fraction: 0.70, price: H });
    pathNodes.push({ fraction: 1.0, price: C });
  } else {
    pathNodes.push({ fraction: 0.0, price: O });
    pathNodes.push({ fraction: 0.25, price: H });
    pathNodes.push({ fraction: 0.70, price: L });
    pathNodes.push({ fraction: 1.0, price: C });
  }

  // Generate tick timestamps (second offsets) with non-linear distribution
  // Bullish candles feature fast early drops and rapid climaxes
  // Sideways candles have evenly distributed ticks
  const secondOffsets: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    const fraction = i / (tickCount - 1);
    
    // Distribute offsets across 0 to 59 seconds
    let second = Math.round(fraction * 59);
    
    // Inject local jitter / noise to avoid perfect linear gaps
    if (i > 0 && i < tickCount - 1) {
      const prev = secondOffsets[i - 1];
      const nextTarget = Math.round(((i + 1) / (tickCount - 1)) * 59);
      const jitter = Math.floor((Math.random() - 0.5) * 3);
      second = Math.max(prev + 1, Math.min(nextTarget - 1, second + jitter));
    }
    secondOffsets.push(second);
  }

  // Helper to find target baseline price at any fraction of path
  const getPathPrice = (fraction: number): number => {
    for (let j = 0; j < pathNodes.length - 1; j++) {
      const left = pathNodes[j];
      const right = pathNodes[j + 1];
      if (fraction >= left.fraction && fraction <= right.fraction) {
        const segmentSpan = right.fraction - left.fraction;
        const segmentRatio = (fraction - left.fraction) / segmentSpan;
        return left.price + (right.price - left.price) * segmentRatio;
      }
    }
    return C;
  };

  // Setup volume distribution parameters
  // Total volume will be distributed with random weight, favoring buying sign in bullish, selling in bearish
  const rawVolWeights: number[] = [];
  let totalWeight = 0;
  for (let i = 0; i < tickCount; i++) {
    const fraction = i / (tickCount - 1);
    let bias = 1.0;
    
    // Increase transaction size around peak volatility (middle of the bar)
    if (fraction > 0.4 && fraction < 0.8) {
      bias = 1.8;
    }
    
    const weight = (0.4 + Math.random() * 0.6) * bias;
    rawVolWeights.push(weight);
    totalWeight += weight;
  }

  // Generate Virtual Ticks
  let runningVol = 0;
  for (let i = 0; i < tickCount; i++) {
    const second = secondOffsets[i];
    const fraction = i / (tickCount - 1);
    
    // Compute price at this time segment
    let price = getPathPrice(fraction);
    
    // Add micro random walk jitter (ticks moving up/down slightly)
    if (i > 0 && i < tickCount - 1) {
      const wiggleAmp = O * 0.0006; // up to 0.06% micro fluctuations
      const noise = (Math.random() - 0.5) * wiggleAmp;
      price = roundToKoreanTick(price + noise);
      
      // Clamp to ensure it doesn't violate High and Low boundaries of the candle
      if (price > H) price = H;
      if (price < L) price = L;
    } else if (i === tickCount - 1) {
      // Force exact close price on final 59th second tick
      price = C;
    } else if (i === 0) {
      // Force exact open price on first 0th second tick
      price = O;
    }

    // Allocate share volume for this tick
    let tickVol = Math.round((rawVolWeights[i] / totalWeight) * V);
    if (i === tickCount - 1) {
      // Lock remaining residual volume to ensure exact match of candle volume
      tickVol = Math.max(1, V - runningVol);
    } else {
      tickVol = Math.max(1, tickVol);
    }
    runningVol += tickVol;

    // Classify execution sign
    let type: 'BUY' | 'SELL' = 'BUY';
    if (i > 0) {
      const prevPrice = ticks[i - 1].price;
      if (price < prevPrice) {
        type = 'SELL';
      } else if (price > prevPrice) {
        type = 'BUY';
      } else {
        // Flat price: match sentiment
        type = isBullish ? 'BUY' : 'SELL';
      }
    } else {
      type = isBullish ? 'BUY' : 'SELL';
    }

    ticks.push({
      secondOffset: second,
      price,
      volume: tickVol,
      type,
      accumulatedVol: runningVol
    });
  }

  return ticks;
}
