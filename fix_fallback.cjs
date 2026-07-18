const fs = require('fs');
let code = fs.readFileSync('src/components/DailyFeaturedStocks.tsx', 'utf-8');

code = code.replace(
/    \} catch \(err: any\) \{[\s\S]*?\} finally \{/,
`    } catch (err: any) {
      console.error('Failed to fetch featured stocks:', err);
      setFeaturedData(null);
      setError("데이터 준비중입니다. 장 마감 후 특징주 분석이 업데이트됩니다.");
    } finally {`
);

const renderEmptyState = `  if (error || !featuredData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Crown className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-4" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{error || "데이터 준비중입니다. 장 마감 후 특징주 분석이 업데이트됩니다."}</p>
      </div>
    );
  }`;

code = code.replace(
/  const fd = featuredData;/,
`${renderEmptyState}\n\n  const fd = featuredData;`
);

fs.writeFileSync('src/components/DailyFeaturedStocks.tsx', code, 'utf-8');
console.log('Fixed fallback logic');
