const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      // Let's find hover/focus prefixes that got split incorrectly
      // Example: hover:bg-white dark:bg-slate-950
      // We want to change it to: hover:bg-white dark:hover:bg-slate-950
      
      const prefixes = ['hover', 'focus', 'active', 'group-hover'];
      
      for (const prefix of prefixes) {
        // e.g. hover:bg-white dark:bg-slate-950 -> hover:bg-white dark:hover:bg-slate-950
        const regex1 = new RegExp(`${prefix}:bg-white dark:bg-slate-950`, 'g');
        content = content.replace(regex1, `${prefix}:bg-white dark:${prefix}:bg-slate-950`);
        
        const regex2 = new RegExp(`${prefix}:bg-slate-50 dark:bg-slate-900`, 'g');
        content = content.replace(regex2, `${prefix}:bg-slate-50 dark:${prefix}:bg-slate-900`);
        
        const regex3 = new RegExp(`${prefix}:bg-slate-200 dark:bg-slate-800`, 'g');
        content = content.replace(regex3, `${prefix}:bg-slate-200 dark:${prefix}:bg-slate-800`);
        
        const regex4 = new RegExp(`${prefix}:text-slate-900 dark:text-slate-100`, 'g');
        content = content.replace(regex4, `${prefix}:text-slate-900 dark:${prefix}:text-slate-100`);
        
        const regex5 = new RegExp(`${prefix}:text-slate-800 dark:text-slate-200`, 'g');
        content = content.replace(regex5, `${prefix}:text-slate-800 dark:${prefix}:text-slate-200`);
        
        const regex6 = new RegExp(`${prefix}:text-slate-700 dark:text-slate-300`, 'g');
        content = content.replace(regex6, `${prefix}:text-slate-700 dark:${prefix}:text-slate-300`);
        
        const regex7 = new RegExp(`${prefix}:text-slate-600 dark:text-slate-400`, 'g');
        content = content.replace(regex7, `${prefix}:text-slate-600 dark:${prefix}:text-slate-400`);
        
        const regex8 = new RegExp(`${prefix}:border-slate-200 dark:border-slate-800`, 'g');
        content = content.replace(regex8, `${prefix}:border-slate-200 dark:${prefix}:border-slate-800`);
        
        const regex9 = new RegExp(`${prefix}:border-slate-300 dark:border-slate-700`, 'g');
        content = content.replace(regex9, `${prefix}:border-slate-300 dark:${prefix}:border-slate-700`);
      }
      
      fs.writeFileSync(fullPath, content, 'utf-8');
    }
  }
}

processDir('src');
console.log('Fixed hovers');
