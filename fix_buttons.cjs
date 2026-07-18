const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Buy buttons (Desktop)
code = code.replace(
  /className=\{`py-2\.5 font-extrabold text-\[11px\] rounded-lg active:scale-95 transition-all cursor-pointer text-center \$\{lastBuyPercent === pct \? 'bg-rose-500 text-white shadow-md' : 'bg-rose-50 dark:bg-rose-500\/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-500\/30'\}`\}/g,
  "className={`py-2.5 font-extrabold text-[11px] rounded-lg active:scale-95 transition-all cursor-pointer text-center ${lastBuyPercent === pct ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}`}"
);

// Sell buttons (Desktop)
code = code.replace(
  /className=\{`py-2\.5 font-extrabold text-\[11px\] rounded-lg active:scale-95 transition-all cursor-pointer text-center \$\{lastSellPercent === pct \? 'bg-blue-500 text-white shadow-md' : 'bg-blue-50 dark:bg-blue-500\/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-500\/30'\}`\}/g,
  "className={`py-2.5 font-extrabold text-[11px] rounded-lg active:scale-95 transition-all cursor-pointer text-center ${lastSellPercent === pct ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}`}"
);

// Buy buttons (Mobile)
code = code.replace(
  /className=\{`py-2 font-extrabold text-\[10px\] rounded active:scale-90 transition-all cursor-pointer text-center \$\{lastBuyPercent === pct \? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-50 dark:bg-rose-500\/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-500\/30'\}`\}/g,
  "className={`py-2 font-extrabold text-[10px] rounded active:scale-90 transition-all cursor-pointer text-center ${lastBuyPercent === pct ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700'}`}"
);

// Sell buttons (Mobile)
code = code.replace(
  /className=\{`py-2 font-extrabold text-\[10px\] rounded active:scale-90 transition-all cursor-pointer text-center \$\{lastSellPercent === pct \? 'bg-blue-500 text-white shadow-sm' : 'bg-blue-50 dark:bg-blue-500\/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-500\/30'\}`\}/g,
  "className={`py-2 font-extrabold text-[10px] rounded active:scale-90 transition-all cursor-pointer text-center ${lastSellPercent === pct ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700'}`}"
);


fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed button colors');
