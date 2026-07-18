const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const newButtons = `
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-colors cursor-pointer h-8 w-8 flex items-center justify-center"
            title={isFullscreen ? "전체화면 종료" : "전체화면"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-colors cursor-pointer h-8 w-8 flex items-center justify-center"
            title={isDarkMode ? "화이트모드" : "다크모드"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
`;

content = content.replace(
  '{/* Audio Speaker Mute Toggle */}',
  newButtons + '\n          {/* Audio Speaker Mute Toggle */}'
);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('Buttons added');
