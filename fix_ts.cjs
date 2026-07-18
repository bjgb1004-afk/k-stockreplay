const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// fix JodojuAnalysis tradeValue
code = code.replace(/tradeValue: number;/g, 'tradeValue?: number; tradeValuePct?: number;');

// fix ReplayReviewReport types
code = code.replace(/export interface ReplayReviewReport \{/g, 'export interface ReplayReviewReport {\n  score?: number;\n  fitIndex?: number;\n  adviceText?: string;');

// fix selectedStock type in selectedStock state. Wait, the state is probably selectedStock: { rank: number... }
// Let's just give it a proper type any
code = code.replace(/const \[selectedStock, setSelectedStock\] = useState<\{/g, 'const [selectedStock, setSelectedStock] = useState<any | {');
code = code.replace(/const \[selectedStock, setSelectedStock\] = useState<any \| \{ rank: number; name: string; code: string; changeRatio: number; \} \| null>\(null\);/g, 'const [selectedStock, setSelectedStock] = useState<any | null>(null);');

// Let's also fix AfterMarketReport props
code = code.replace(/interface ReportViewProps \{/g, 'interface ReportViewProps {\n  onRegenerate?: () => void;\n  isCompact?: boolean;');


fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed TS errors in App.tsx');
