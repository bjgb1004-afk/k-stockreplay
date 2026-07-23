const fs = require('fs');
let code = fs.readFileSync('src/components/StockCalendarView.tsx', 'utf8');
code = code.replace(/<strong className="text-indigo-400">\[\{stock\.theme \|\| "테마 미확정"\}\]<\/strong> \{stock\.reason \|\| "급등 사유 분석 요약 중"\}/g, 
`<strong className="text-indigo-400">[{stock.sector || stock.theme || "섹터 미확정"}]</strong> {stock.riseReason || stock.reason || "급등 사유 분석 요약 중"}`);
fs.writeFileSync('src/components/StockCalendarView.tsx', code);
