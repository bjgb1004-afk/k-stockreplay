const fs = require('fs');

const files = [
  'src/components/CanvasChart.tsx',
  'src/components/LeaderboardChart.tsx',
  'src/components/ReplayChart.tsx',
  'src/components/VolumeChart.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');

  // Find the useEffect where observer is defined. 
  // We can just replace `const observer = new MutationObserver` with `observer = new MutationObserver`
  // and prepend `let observer: MutationObserver | null = null;` at the start of the useEffect or just declare it at the module level or inside the component? No, inside useEffect.
  // The easiest way without parsing AST is just changing `const observer = new MutationObserver` to `const observer = new MutationObserver` -> Wait, we can declare `let observer: MutationObserver | null = null;` right before `const container = containerRef.current;` or something.
  
  // Or even simpler: we can attach observer to the chart object so we can access it later!
  // `(chart as any).__observer = new MutationObserver(...)`
  // and in cleanup: `if ((chart as any).__observer) (chart as any).__observer.disconnect();`
  
  content = content.replace(/const observer = new MutationObserver/g, "(chart as any).__observer = new MutationObserver");
  content = content.replace(/observer\.observe/g, "(chart as any).__observer.observe");
  content = content.replace(/observer\.disconnect\(\);/g, "if ((chart as any)?.__observer) (chart as any).__observer.disconnect();");

  fs.writeFileSync(file, content, 'utf-8');
  console.log(`Fixed observer in ${file}`);
}
