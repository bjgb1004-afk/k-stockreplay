const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const stateBlock = `
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(\`Error attempting to enable fullscreen: \${err.message}\`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
`;

content = content.replace("const [gameMode, setGameMode] = useState<'daily' | 'minute'>('daily');", "const [gameMode, setGameMode] = useState<'daily' | 'minute'>('daily');\n" + stateBlock);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('States added');
