import * as cheerio from 'cheerio';
async function run() {
  const res = await fetch('https://search.naver.com/search.naver?query=%EC%83%81%ED%95%9C%EA%B0%80&nso=so%3Add%2Cp%3Afrom20240716to20240716%2Ca%3Aall');
  const html = await res.text();
  const $ = cheerio.load(html);
  const results = [];
  $('.news_tit').each((i, el) => {
    results.push($(el).text());
  });
  console.log(results);
}
run();
