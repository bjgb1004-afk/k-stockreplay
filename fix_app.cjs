const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Import
code = code.replace(
  /import \{ MorningNews2026 \} from '\.\/components\/MorningNews2026';/,
  "import { MorningNews2026 } from './components/MorningNews2026';\nimport { AfterMarketNews } from './components/AfterMarketNews';"
);

// 2. Add Launcher menu item
const launcherItem = `
                      {/* Item: 장마감 뉴스 */}
                      <a
                        href="#aftermarket-briefing"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowLauncherMenu(false);
                          setAiFeedActiveTab('afternoon');
                          setShowAiFeedModal(true);
                        }}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-950/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-800/60 transition-all duration-200"
                      >
                        <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/25 transition-colors shrink-0 mt-0.5">
                          <ActivitySquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-rose-400 transition-colors">장마감 뉴스</span>
                            <span className="text-[9px] font-mono font-black px-1.5 bg-rose-500/20 text-rose-400 rounded">AFTERNOON</span>
                          </div>
                        </div>
                      </a>`;

code = code.replace(
  /MORNING<\/span>\n\s*<\/div>\n\s*<\/div>\n\s*<\/a>\n\s*<\/div>/,
  `MORNING</span>
                          </div>
                        </div>
                      </a>
${launcherItem}
                    </div>`
);

// 3. Update the modal content rendering
code = code.replace(
  /\{\/\* Afternoon Report Content \*\/\}\n\s*\{aiFeedActiveTab === 'afternoon' && \(\n\s*<div className="space-y-4">\n\s*<ReportView \n\s*report=\{afterMarketReport\}\n\s*onRegenerate=\{async \(\) => \{\n\s*setReportLoading\(true\);\n\s*await fetch\('\/api\/platform\/report', \{ method: 'POST' \}\);\n\s*await fetchAfterMarketReport\(\);\n\s*\}\}\n\s*loading=\{reportLoading\}\n\s*onSelectStock=\{\(code\) => \{\n\s*const match = findStockByCode\(code\);\n\s*if \(match\) \{\n\s*setSelectedStock\(match\);\n\s*setPlatformTab\('replay'\);\n\s*setShowAiFeedModal\(false\);\n\s*\}\n\s*\}\}\n\s*isCompact=\{false\}\n\s*\/>\n\s*<\/div>\n\s*\)\}/,
  `{/* Afternoon Report Content */}
                {aiFeedActiveTab === 'afternoon' && (
                  <div className="space-y-4">
                    <AfterMarketNews />
                  </div>
                )}`
);


fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('App.tsx updated');
