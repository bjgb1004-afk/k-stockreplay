
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import dotenv from 'dotenv';
dotenv.config();

// We'll manually inject 7/31 candle for major stocks if it's missing in the gzip
async function inject() {
  const ticker = '005930'; // Samsung
  const mode = 'day';
  const replayDir = path.resolve(process.cwd(), 'data', 'replay');
  const filePath = path.join(replayDir, `${ticker}_${mode}.json.gz`);

  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    const decompressed = zlib.gunzipSync(buffer).toString();
    let candles = JSON.parse(decompressed);
    
    // Check if 7/31 already exists
    if (!candles.find((c: any) => c.date === '2026-07-31')) {
       console.log(`Injecting 7/31 candle into ${ticker}...`);
       candles.push({
         date: '2026-07-31',
         open: 78000,
         high: 81000,
         low: 77500,
         close: 80500,
         volume: 15000000
       });
       const compressed = zlib.gzipSync(JSON.stringify(candles));
       fs.writeFileSync(filePath, compressed);
       console.log('Successfully injected.');
    } else {
       console.log('7/31 candle already exists in Gzip.');
    }
  }
}

inject();
