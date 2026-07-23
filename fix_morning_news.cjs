const fs = require('fs');

let content = fs.readFileSync('src/components/MorningNews2026.tsx', 'utf-8');

// Remove state
content = content.replace(/const \[isDark, setIsDark\] = useState\(true\);\n/g, "");

// Remove toggle button
const buttonRegex = /<button[\s\S]*?onClick=\{\(\) => setIsDark\(!isDark\)\}[\s\S]*?<\/button>/g;
content = content.replace(buttonRegex, "");

// Replace conditional logic with tailwind dark variants
// e.g. ${isDark ? 'text-white' : 'text-slate-900'} -> text-slate-900 dark:text-white
content = content.replace(/\$\{isDark \? '([^']+)' : '([^']+)'\}/g, "$2 dark:$1");

// some things might have been duplicated like text-slate-900 dark:text-slate-200 if they were already fixed.
// let's just do a blind replace and see.
fs.writeFileSync('src/components/MorningNews2026.tsx', content, 'utf-8');
console.log('Fixed MorningNews2026');
