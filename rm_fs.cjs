const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/const \[isFullscreen, setIsFullscreen\] = useState<boolean>\(false\);\n/g, '');
code = code.replace(/  const toggleFullscreen = \(\) => \{\n    if \(\!document\.fullscreenElement\) \{\n      document\.documentElement\.requestFullscreen\(\)\.catch\(err => \{\n        console\.warn\(`Error attempting to enable fullscreen: \$\{err\.message\}`\);\n      \}\);\n    \} else \{\n      if \(document\.exitFullscreen\) \{\n        document\.exitFullscreen\(\);\n      \}\n    \}\n  \};\n/g, '');
code = code.replace(/  useEffect\(\(\) => \{\n    const handleFullscreenChange = \(\) => \{\n      setIsFullscreen\(\!\!document\.fullscreenElement\);\n    \};\n    document\.addEventListener\('fullscreenchange', handleFullscreenChange\);\n    return \(\) => document\.removeEventListener\('fullscreenchange', handleFullscreenChange\);\n  \}, \[\]\);\n/g, '');

const btnRegex = /\s*\{\/\* Fullscreen Toggle \*\/\}\s*<button\s*onClick=\{toggleFullscreen\}[\s\S]*?<\/button>/;
code = code.replace(btnRegex, '');

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Removed fullscreen');
