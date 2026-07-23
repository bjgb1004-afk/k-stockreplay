const fs = require('fs');

let content = fs.readFileSync('src/components/CanvasChart.tsx', 'utf-8');

// The messed up part is from:
//   useEffect(() => {
//     if (!panelRef.current) return;
//     const observer = new ResizeObserver((entries) => {
// ...
//     });
//     observer.observe(node);
//       panelObserverRef.current = observer;
//     }
//   }, []);

// Let's replace it back to the proper ResizeObserver on panelRef.current

const badBlock = `  useEffect(() => {
    if (!panelRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setPanelHeight((prev) => {
            return Math.abs(prev - height) > 1.5 ? Math.round(height) : prev;
          });
        }
      }
    });
    observer.observe(node);
      panelObserverRef.current = observer;
    }
  }, []);`;

const goodBlock = `  useEffect(() => {
    if (!panelRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setPanelHeight((prev) => {
            return Math.abs(prev - height) > 1.5 ? Math.round(height) : prev;
          });
        }
      }
    });
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);`;

content = content.replace(badBlock, goodBlock);
fs.writeFileSync('src/components/CanvasChart.tsx', content, 'utf-8');
console.log('Fixed CanvasChart again');
