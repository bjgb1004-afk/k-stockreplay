const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-slate-950': 'bg-white dark:bg-slate-950',
  'bg-slate-900': 'bg-slate-50 dark:bg-slate-900',
  'bg-slate-800': 'bg-slate-200 dark:bg-slate-800',
  'bg-slate-700': 'bg-slate-300 dark:bg-slate-700',
  'text-slate-100': 'text-slate-900 dark:text-slate-100',
  'text-slate-200': 'text-slate-800 dark:text-slate-200',
  'text-slate-300': 'text-slate-700 dark:text-slate-300',
  'text-slate-400': 'text-slate-600 dark:text-slate-400',
  'text-slate-500': 'text-slate-500 dark:text-slate-500',
  'border-slate-800': 'border-slate-200 dark:border-slate-800',
  'border-slate-850': 'border-slate-200 dark:border-slate-850',
  'border-slate-700': 'border-slate-300 dark:border-slate-700',
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      if (fullPath === 'src/App.tsx.new') continue;
      
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;
      
      for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(`(?<!dark:)(?<!\\w)${key}(?!\\w)`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, value);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Replaced colors in ${fullPath}`);
      }
    }
  }
}

processDir('src');
