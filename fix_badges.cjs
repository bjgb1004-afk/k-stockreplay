const fs = require('fs');
let code = fs.readFileSync('src/components/JodojuAnalysisView.tsx', 'utf8');
code = code.replace(/<div className="flex flex-wrap gap-1\.5 mb-2">\s*\{\(currentStock\.relatedThemes \|\| \[\]\)\.map\(\(theme: string, tIdx: number\) => \(\s*<span\s*key=\{tIdx\}\s*className="bg-indigo-500\/10 hover:bg-indigo-500\/20 text-indigo-400 text-\[9px\] font-black px-2 py-0\.5 rounded border border-indigo-500\/10 transition"\s*>\s*\{theme\}\s*<\/span>\s*\)\)\}\s*<\/div>/g,
`<div className="flex flex-wrap gap-1.5 mb-2">
                {currentStock.sector && (
                  <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20">
                    {currentStock.sector}
                  </span>
                )}
                {currentStock.theme && (
                  <span className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded border border-indigo-500/10 transition">
                    {currentStock.theme}
                  </span>
                )}
                {(currentStock.tags || []).map((tag: string, tIdx: number) => (
                  <span 
                    key={tIdx} 
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-black px-2 py-0.5 rounded border border-rose-500/10 transition"
                  >
                    #{tag}
                  </span>
                ))}
              </div>`);
fs.writeFileSync('src/components/JodojuAnalysisView.tsx', code);
