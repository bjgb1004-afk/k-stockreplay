const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const fetch = require('node-fetch');

async function getNaverList(url, isQuant) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const html = iconv.decode(Buffer.from(buffer), 'euc-kr');
    const $ = cheerio.load(html);
    
    const list = [];
    $('.type_2 tbody tr').each((i, el) => {
      const a = $(el).find('a.tltle');
      if (a.length > 0) {
        const href = a.attr('href');
        const name = a.text().trim();
        const match = href?.match(/code=(\d{6})/);
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

async function generateJodojuList() {
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
      let intersection = rising.filter(r => volumeMap.has(r.code)).map(r => volumeMap.get(r.code));
      intersection.sort((a, b) => b.changeRatio - a.changeRatio);
      intersection = intersection.slice(0, 10);
      
      console.log('Intersection size:', intersection.length);
      console.log(intersection);
    } catch(err) {
      console.error(err);
    }
}
generateJodojuList();
