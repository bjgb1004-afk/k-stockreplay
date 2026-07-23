const fs = require('fs');
let code = fs.readFileSync('.github/workflows/after_market_briefing.yml', 'utf-8');

code = code.replace(
  /run: npx tsx scripts\/run_briefing_automation\.ts/,
  "run: npx tsx scripts/run_briefing_automation.ts\n\n      - name: 당일 특징주 스크립트 실행 (Run Featured Stocks Script)\n        env:\n          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}\n          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}\n          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}\n        run: npx tsx scripts/update_featured_stocks.ts"
);

fs.writeFileSync('.github/workflows/after_market_briefing.yml', code, 'utf-8');
console.log('updated after_market_briefing.yml');
