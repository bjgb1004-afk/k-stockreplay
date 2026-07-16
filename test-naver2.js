const fetch = require('node-fetch');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

async function getList(url) {
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
      const match = href.match(/code=(\d+)/);
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
  const rising = [...r0, ...r1]; // taking KOSPI and KOSDAQ
  console.log('Rising count:', rising.length);

  const v0 = await getList('https://finance.naver.com/sise/sise_quant.naver?sosok=0');
  const v1 = await getList('https://finance.naver.com/sise/sise_quant.naver?sosok=1');
  const volume = [...v0, ...v1];
  console.log('Volume count:', volume.length);
  
  const volumeCodes = new Set(volume.map(v => v.code));
  const intersection = rising.filter(r => volumeCodes.has(r.code)).slice(0, 10);
  console.log('Intersection:', intersection);
}
test();
