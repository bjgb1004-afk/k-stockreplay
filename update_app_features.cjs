const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /import \{ AfterMarketNews \} from '\.\/components\/AfterMarketNews';/,
  "import { AfterMarketNews } from './components/AfterMarketNews';\nimport { DailyFeaturedStocks } from './components/DailyFeaturedStocks';"
);

// Add to launcher
const featureItem = `
                      {/* Item: 당일 특징주 */}
                      <a
                        href="#featured-stocks"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowLauncherMenu(false);
                          setAiFeedActiveTab('features');
                          setShowAiFeedModal(true);
                        }}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-950/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-800/60 transition-all duration-200"
                      >
                        <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-amber-500 group-hover:bg-amber-500/25 transition-colors shrink-0 mt-0.5">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors">당일 특징주</span>
                            <span className="text-[9px] font-mono font-black px-1.5 bg-amber-500/20 text-amber-500 rounded">FEATURES</span>
                          </div>
                        </div>
                      </a>`;

code = code.replace(
  /AFTERNOON<\/span>\n\s*<\/div>\n\s*<\/div>\n\s*<\/a>/,
  `AFTERNOON</span>
                          </div>
                        </div>
                      </a>
${featureItem}`
);

// Add Tab
code = code.replace(
  /onClick=\{\(\) => setAiFeedActiveTab\('afternoon'\)\}\n\s*className=\{\`flex-1 py-3 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-colors \$\{aiFeedActiveTab === 'afternoon' \? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'\}\`\}\n\s*>\n\s*<ActivitySquare className="w-4 h-4" \/>\n\s*장마감 뉴스\n\s*<\/button>\n\s*<\/div>/,
  `onClick={() => setAiFeedActiveTab('afternoon')}
                  className={\`flex-1 py-3 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-colors \${aiFeedActiveTab === 'afternoon' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                >
                  <ActivitySquare className="w-4 h-4" />
                  장마감 뉴스
                </button>
                <button
                  onClick={() => setAiFeedActiveTab('features')}
                  className={\`flex-1 py-3 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-colors \${aiFeedActiveTab === 'features' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                >
                  <Crown className="w-4 h-4" />
                  당일 특징주
                </button>
              </div>`
);

// Render Tab
code = code.replace(
  /\{aiFeedActiveTab === 'afternoon' && \(\n\s*<div className="space-y-4">\n\s*<AfterMarketNews \/>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/,
  `{aiFeedActiveTab === 'afternoon' && (
                  <div className="space-y-4">
                    <AfterMarketNews />
                  </div>
                )}
                {/* Features Report Content */}
                {aiFeedActiveTab === 'features' && (
                  <div className="space-y-4">
                    <DailyFeaturedStocks />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}`
);

// Make sure `features` is a valid tab type if it's explicitly typed
code = code.replace(
  /const \[aiFeedActiveTab, setAiFeedActiveTab\] = useState<'morning' | 'afternoon'>\('morning'\);/,
  "const [aiFeedActiveTab, setAiFeedActiveTab] = useState<'morning' | 'afternoon' | 'features'>('morning');"
);

// Add Crown to imports
code = code.replace(
  /ActivitySquare,\n\} from 'lucide-react';/,
  "ActivitySquare,\n  Crown,\n} from 'lucide-react';"
);


fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('App.tsx features updated');
