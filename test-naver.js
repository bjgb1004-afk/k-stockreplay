const fetch = require('node-fetch');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

async function test() {
  const vurl1 = 'https://finance.naver.com/sise/sise_quant.naver?sosok=0';
  const vurl2 = 'https://finance.naver.com/sise/sise_quant.naver?sosok=1';
  // wait, sise_quant includes both KOSPI and KOSDAQ if sosok is not specified?
  // Let's just fetch default and parse.
}
test();
