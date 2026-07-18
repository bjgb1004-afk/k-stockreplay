const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

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
  'border-slate-850': 'border-slate-200 dark:border-slate-850', // Wait, 850 doesn't exist standard but used?
  'border-slate-700': 'border-slate-300 dark:border-slate-700',
};

// We must be careful not to replace things inside existing dark: or bg-white if it already exists
// For simplicity, let's just do a naive replacement if they don't already have dark: prefix.
for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(`(?<!dark:)(?<!\\w)${key}(?!\\w)`, 'g');
  content = content.replace(regex, value);
}

fs.writeFileSync('src/App.tsx.new', content, 'utf-8');
console.log('Replaced colors');
