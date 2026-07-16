const fs = require('fs');
let content = fs.readFileSync('api/express-app.ts', 'utf-8');

const startIdx = content.indexOf('async function getNaverList(url: string) {');
const endIdx = content.indexOf('app.get(\'/api/jodoju-list\'', startIdx);

const newFunction = `async function getNaverList(url: string, isQuant: boolean) {
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
          const tds = $(el).find('td');
          const priceStr = tds.eq(2).text().replace(/,/g, '').trim();
          const changeRatioStr = tds.eq(4).text().replace(/,/g, '').replace('%', '').trim();
          const volumeStr = tds.eq(5).text().replace(/,/g, '').trim();
          let tradingValueStr = '0';
          if (isQuant) {
             tradingValueStr = tds.eq(6).text().replace(/,/g, '').trim();
          }

          const price = parseInt(priceStr, 10) || 0;
          const changeRatio = parseFloat(changeRatioStr) || 0;
          const volume = parseInt(volumeStr, 10) || 0;
          let tradingValue = 0;
          if (isQuant) {
             tradingValue = (parseInt(tradingValueStr, 10) || 0) * 1000000;
          } else {
             tradingValue = Math.round((price * volume) / 1000000) * 1000000;
          }

          list.push({ code: match[1], name, changeRatio, price, volume, tradingValue });
        }
      }
    });
    return list;
  }

  async function generateJodojuList(): Promise<any[]> {
    console.log('[주도주 업데이트] 상승률 상위 100위와 거래대금 상위 200위의 교집합을 추출합니다...');
    try {
      const r0 = await getNaverList('https://finance.naver.com/sise/sise_rise.naver?sosok=0', false);
      const r1 = await getNaverList('https://finance.naver.com/sise/sise_rise.naver?sosok=1', false);
      let rising = [...r0.slice(0, 50), ...r1.slice(0, 50)];
      rising = rising.filter(r => !/KODEX|TIGER|SOL |PLUS |ARIRANG|KOSEF|KBSTAR|ACE |HANARO|인버스|레버리지|선물|스팩|ETN|ETF/i.test(r.name));

      const v0 = await getNaverList('https://finance.naver.com/sise/sise_quant.naver?sosok=0', true);
      const v1 = await getNaverList('https://finance.naver.com/sise/sise_quant.naver?sosok=1', true);
      let volume = [...v0.slice(0, 100), ...v1.slice(0, 100)];
      volume = volume.filter(r => !/KODEX|TIGER|SOL |PLUS |ARIRANG|KOSEF|KBSTAR|ACE |HANARO|인버스|레버리지|선물|스팩|ETN|ETF/i.test(r.name));
      
      const volumeMap = new Map(volume.map(v => [v.code, v]));
      
      // For intersection, we use the matched object from volumeMap to get accurate trading value
      let intersection = rising.filter(r => volumeMap.has(r.code)).map(r => volumeMap.get(r.code));
      
      // Sort by tradingValue (highest first) or changeRatio? The user originally said "상승률 100위에서 거래대금 200위 교집합" 
      // Let's sort by changeRatio for the top 10.
      intersection.sort((a, b) => b.changeRatio - a.changeRatio);
      intersection = intersection.slice(0, 10);
      
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
