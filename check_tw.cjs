const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');
css = '@import "tailwindcss";\n@variant dark (&:is(.dark *));\n\n' + css.replace('@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));\n', '');
fs.writeFileSync('src/index.css', css, 'utf-8');
