const fs = require('fs');

let content = fs.readFileSync('api/express-app.ts', 'utf-8');

// Add cheerio import
if (!content.includes("import * as cheerio from 'cheerio';")) {
  content = content.replace("import iconv from 'iconv-lite';", "import iconv from 'iconv-lite';\nimport * as cheerio from 'cheerio';");
}

// Replace generateJodojuList completely
const startIdx = content.indexOf('async function generateJodojuList(): Promise<any[]> {');
const endIdx = content.indexOf('const JODOJU_CACHE_FILE', startIdx);

const newFunction = `async function getNaverList(url: string) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const html = iconv.decode(Buffer.from(buffer), 'euc-kr');
    const $ = cheerio.load(html);
    
    const list: any[] = [];
    $('.type_2 tbody tr').each((i, el) => {
      const a = $(el).find('a.tltle');
      if (a.length > 0) {
        const href = a.attr('href');
        const name = a.text().trim();
        const match = href?.match(/code=(\\d{6})/);
        if (match) {
          list.push({ code: match[1], name, changeRatio: 0, price: 0, volume: 0, tradingValue: 0 }); // Mock metadata as we fetch candles later
        }
      }
    });
    return list;
  }

  async function generateJodojuList(): Promise<any[]> {
    console.log('[주도주 업데이트] 상승률 상위 100위와 거래대금 상위 200위의 교집합을 추출합니다...');
    try {
      const r0 = await getNaverList('https://finance.naver.com/sise/sise_rise.naver?sosok=0');
      const r1 = await getNaverList('https://finance.naver.com/sise/sise_rise.naver?sosok=1');
      let rising = [...r0.slice(0, 50), ...r1.slice(0, 50)];
      rising = rising.filter(r => !/KODEX|TIGER|SOL |PLUS |ARIRANG|KOSEF|KBSTAR|ACE |HANARO|인버스|레버리지|선물|스팩|ETN|ETF/i.test(r.name));

      const v0 = await getNaverList('https://finance.naver.com/sise/sise_quant.naver?sosok=0');
      const v1 = await getNaverList('https://finance.naver.com/sise/sise_quant.naver?sosok=1');
      let volume = [...v0.slice(0, 100), ...v1.slice(0, 100)];
      volume = volume.filter(r => !/KODEX|TIGER|SOL |PLUS |ARIRANG|KOSEF|KBSTAR|ACE |HANARO|인버스|레버리지|선물|스팩|ETN|ETF/i.test(r.name));
      
      const volumeCodes = new Set(volume.map(v => v.code));
      const intersection = rising.filter(r => volumeCodes.has(r.code)).slice(0, 10);
      console.log('[주도주 업데이트] 교집합 종목 수:', intersection.length);
      return intersection;
    } catch(err) {
      console.error('[generateJodojuList] Failed:', err);
      return [];
    }
  }

  `;

content = content.substring(0, startIdx) + newFunction + content.substring(endIdx);
fs.writeFileSync('api/express-app.ts', content);
console.log('Done replacement');
