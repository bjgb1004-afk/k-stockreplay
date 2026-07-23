const fs = require('fs');
let content = fs.readFileSync('src/components/CanvasChart.tsx', 'utf-8');

content = content.replace(
  /\}\);\n    observer\.observe\(node\);\n      panelObserverRef\.current = observer;\n    \}\n  \}, \[\]\);\n  \}, \[\]\);/g,
  "});\n    observer.observe(node);\n      panelObserverRef.current = observer;\n    }\n  }, []);"
);

fs.writeFileSync('src/components/CanvasChart.tsx', content, 'utf-8');
