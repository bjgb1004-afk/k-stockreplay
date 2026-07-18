const fs = require('fs');
let code = fs.readFileSync('src/components/DailyFeaturedStocks.tsx', 'utf-8');

const target = `      if (error) {
        throw error;
      }

      setFeaturedData(data?.data);`;

const replacement = `      if (error || !data || !data.data || Object.keys(data.data).length === 0) {
        throw error || new Error("No data found");
      }

      setFeaturedData(data.data);`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/DailyFeaturedStocks.tsx', code, 'utf-8');
console.log('Fixed DailyFeaturedStocks.tsx fetch logic');
