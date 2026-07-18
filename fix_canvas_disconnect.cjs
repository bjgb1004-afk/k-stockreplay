const fs = require('fs');

let content = fs.readFileSync('src/components/CanvasChart.tsx', 'utf-8');

content = content.replace(
  /chartRef\.current\.remove\(\);/g,
  "if ((chartRef.current as any)?.__observer) (chartRef.current as any).__observer.disconnect();\n          chartRef.current.remove();"
);

fs.writeFileSync('src/components/CanvasChart.tsx', content, 'utf-8');
