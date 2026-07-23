const fs = require('fs');

const files = [
  'src/components/CanvasChart.tsx',
  'src/components/LeaderboardChart.tsx',
  'src/components/ReplayChart.tsx',
  'src/components/VolumeChart.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');

  content = content.replace(
    /return \(\) => if \(\(chart as any\)\?\.__observer\) \(chart as any\)\.__observer\.disconnect\(\);/g,
    "return () => { if ((chart as any)?.__observer) (chart as any).__observer.disconnect(); };"
  );
  
  // also, in LeaderboardChart I see:
  // if ((chart as any)?.__observer) (chart as any).__observer.disconnect();
  //       chart.remove();
  // so let's just replace the raw ones
  content = content.replace(
    /if \(\(chart as any\)\?\.__observer\) \(chart as any\)\.__observer\.disconnect\(\);\n\s*chart\.remove\(\);/g,
    "if ((chart as any)?.__observer) (chart as any).__observer.disconnect();\n      chart.remove();"
  );

  fs.writeFileSync(file, content, 'utf-8');
  console.log(`Fixed syntax in ${file}`);
}
