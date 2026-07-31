import { PlatformEngine } from './server-core/platform_engine';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const report = await PlatformEngine.generateAfterMarketReportAI(["005930", "000660"]);
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error("Outer error:", err);
  }
}

run();
