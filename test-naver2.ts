import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

async function getList(url: string) {
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
      const match = href?.match(/code=(\d{6})/);
      if (match) {
        list.push({ code: match[1], name });
      }
    }
  });
  return list;
}

async function test() {
  const r0 = await getList('https://finance.naver.com/sise/sise_rise.naver?sosok=0');
  const r1 = await getList('https://finance.naver.com/sise/sise_rise.naver?sosok=1');
  let rising = [...r0.slice(0, 50), ...r1.slice(0, 50)];
  rising = rising.filter(r => !/KODEX|TIGER|SOL |PLUS |ARIRANG|KOSEF|KBSTAR|ACE |HANARO|인버스|레버리지|선물|스팩|ETN|ETF/i.test(r.name));

  const v0 = await getList('https://finance.naver.com/sise/sise_quant.naver?sosok=0');
  const v1 = await getList('https://finance.naver.com/sise/sise_quant.naver?sosok=1');
  let volume = [...v0.slice(0, 100), ...v1.slice(0, 100)];
  volume = volume.filter(r => !/KODEX|TIGER|SOL |PLUS |ARIRANG|KOSEF|KBSTAR|ACE |HANARO|인버스|레버리지|선물|스팩|ETN|ETF/i.test(r.name));
  
  const volumeCodes = new Set(volume.map(v => v.code));
  const intersection = rising.filter(r => volumeCodes.has(r.code)).slice(0, 10);
  console.log('Intersection:', intersection);
}
test();
