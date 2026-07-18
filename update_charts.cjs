const fs = require('fs');

const files = [
  'src/components/CanvasChart.tsx',
  'src/components/LeaderboardChart.tsx',
  'src/components/ReplayChart.tsx',
  'src/components/VolumeChart.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');

  // Replace background and textColor with dynamic getters
  content = content.replace(
    /background:\s*\{\s*type:\s*'solid'\s*as\s*any,\s*color:\s*'#[a-fA-F0-9]+'\s*\},[^\n]*\n/g,
    "background: { type: 'solid' as any, color: document.documentElement.classList.contains('dark') ? '#020617' : '#ffffff' },\n"
  );
  
  content = content.replace(
    /textColor:\s*'#[a-fA-F0-9]+',[^\n]*\n/g,
    "textColor: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',\n"
  );
  
  // Also fix grid lines color if it exists
  content = content.replace(
    /color:\s*'#1e293b'/g,
    "color: document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'"
  );
  
  // To make it react to theme changes, we can add a MutationObserver, or just rely on re-renders.
  // We'll add a MutationObserver to the useEffect that creates the chart.
  if (!content.includes('MutationObserver')) {
    const observerCode = `
      const observer = new MutationObserver(() => {
        const isDark = document.documentElement.classList.contains('dark');
        chart.applyOptions({
          layout: {
            background: { type: 'solid' as any, color: isDark ? '#020617' : '#ffffff' },
            textColor: isDark ? '#94a3b8' : '#64748b',
          }
        });
        chart.priceScale('right').applyOptions({
          borderColor: isDark ? '#1e293b' : '#e2e8f0',
        });
        chart.timeScale().applyOptions({
          borderColor: isDark ? '#1e293b' : '#e2e8f0',
        });
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
`;
    // Find where the chart is created, and append observerCode after chart creation
    content = content.replace(/(chart = createChart[^\n]*\{[\s\S]*?\}\);)/, "$1" + observerCode);
    
    // In the return cleanup, disconnect observer
    content = content.replace(/(chart\.remove\(\);)/, "observer.disconnect();\n      $1");
  }

  fs.writeFileSync(file, content, 'utf-8');
  console.log(`Updated ${file}`);
}
