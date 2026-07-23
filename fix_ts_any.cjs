const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace { rank: number; name: string; code: string; changeRatio: number; } with any in useState
code = code.replace(/useState<\{ rank: number; name: string; code: string; changeRatio: number; \} \| null>/g, 'useState<any | null>');
code = code.replace(/useState<\{ rank: number; name: string; code: string; changeRatio: number; \}>/g, 'useState<any>');

// Replace JodojuAnalysis tradeValue
code = code.replace(/tradeValuePct: number;/g, 'tradeValuePct: number;\n  tradeValue?: number;');

// Replace ReplayReviewReport types
code = code.replace(/interface ReplayReviewReport \{/g, 'interface ReplayReviewReport {\n  score?: number;\n  fitIndex?: number;\n  adviceText?: string;');

code = code.replace(/export interface ReplayReviewReport \{/g, 'export interface ReplayReviewReport {\n  score?: number;\n  fitIndex?: number;\n  adviceText?: string;');

// Replace ReportViewProps
code = code.replace(/interface ReportViewProps \{/g, 'interface ReportViewProps {\n  onRegenerate?: () => void;\n  isCompact?: boolean;');

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed more TS errors');
