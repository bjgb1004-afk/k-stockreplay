const fs = require('fs');
let code = fs.readFileSync('src/components/ReplayChart.tsx', 'utf-8');

code = code.replace(
  /chart\.priceScale\('volume-scale'\)\.applyOptions\(\{\n\s*scaleMargins: \{\n\s*top: 0\.8, \/\/ Volume takes only bottom 20%\n\s*bottom: 0,\n\s*\},\n\s*\}\);/,
  `volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8, // Volume takes only bottom 20%
          bottom: 0,
        },
      });`
);

fs.writeFileSync('src/components/ReplayChart.tsx', code, 'utf-8');
console.log('Fixed priceScale');
