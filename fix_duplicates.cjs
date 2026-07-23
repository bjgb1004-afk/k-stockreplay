const fs = require('fs');

let content = fs.readFileSync('src/components/MorningNews2026.tsx', 'utf-8');

content = content.replace(/dark:bg-slate-50 dark:bg-slate-900/g, 'dark:bg-slate-900');
content = content.replace(/dark:bg-white dark:bg-slate-950/g, 'dark:bg-slate-950');
content = content.replace(/dark:border-slate-200 dark:border-slate-800/g, 'dark:border-slate-800');
content = content.replace(/dark:border-slate-200 dark:border-slate-850/g, 'dark:border-slate-850');
content = content.replace(/dark:text-slate-500 dark:text-slate-500/g, 'dark:text-slate-500');
content = content.replace(/dark:text-slate-600 dark:text-slate-400/g, 'dark:text-slate-400');
content = content.replace(/dark:text-slate-700 dark:text-slate-300/g, 'dark:text-slate-300');
content = content.replace(/dark:text-slate-800 dark:text-slate-200/g, 'dark:text-slate-200');

fs.writeFileSync('src/components/MorningNews2026.tsx', content, 'utf-8');
console.log('Fixed duplicates');
