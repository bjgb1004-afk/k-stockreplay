const fs = require('fs');
let code = fs.readFileSync('src/components/LeaderboardChart.tsx', 'utf-8');

code = code.replace(
  /chart\.priceScale\('volume-scale'\)\.applyOptions\(\{\n\s*scaleMargins: \{\n\s*top: 0\.8,\n\s*bottom: 0,\n\s*\},\n\s*\}\);/,
  `volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });`
);

fs.writeFileSync('src/components/LeaderboardChart.tsx', code, 'utf-8');
console.log('Fixed priceScale in LeaderboardChart');
