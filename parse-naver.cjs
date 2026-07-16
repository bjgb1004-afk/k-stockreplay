const fetch = require('node-fetch');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

async function test() {
  const url = 'https://finance.naver.com/sise/sise_quant.naver?sosok=0';
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const html = iconv.decode(Buffer.from(buffer), 'euc-kr');
  const $ = cheerio.load(html);
  
  const row = $('.type_2 tbody tr').eq(2); // First data row, skip headers
  console.log(row.html());
}
test();
