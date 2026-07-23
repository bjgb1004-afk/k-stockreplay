const fs = require('fs');
let content = fs.readFileSync('src/components/CanvasChart.tsx', 'utf-8');

// fix panel observer
content = content.replace(
  /\(chart as any\)\.__observer\.observe\(panelRef\.current\);\s*return \(\) => \{ if \(\(chart as any\)\?\.__observer\) \(chart as any\)\.__observer\.disconnect\(\); \};/g,
  "observer.observe(node);\n      panelObserverRef.current = observer;\n    }\n  }, []);"
);

// fix header observer
content = content.replace(
  /\(chart as any\)\.__observer\.observe\(node\);\s*headerObserverRef\.current = observer;/g,
  "observer.observe(node);\n      headerObserverRef.current = observer;"
);

// fix disconnects inside the useCallback
content = content.replace(
  /if \(\(chart as any\)\?\.__observer\) \(chart as any\)\.__observer\.disconnect\(\);\s*panelObserverRef\.current = null;/g,
  "panelObserverRef.current.disconnect();\n      panelObserverRef.current = null;"
);

content = content.replace(
  /if \(\(chart as any\)\?\.__observer\) \(chart as any\)\.__observer\.disconnect\(\);\s*headerObserverRef\.current = null;/g,
  "headerObserverRef.current.disconnect();\n      headerObserverRef.current = null;"
);


fs.writeFileSync('src/components/CanvasChart.tsx', content, 'utf-8');
console.log('Fixed CanvasChart');
