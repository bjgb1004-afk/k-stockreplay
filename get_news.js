import * as cheerio from 'cheerio';
async function run() {
  const res = await fetch('https://search.naver.com/search.naver?query=%EC%9C%84%EB%8B%89%EC%8A%A4+%ED%8C%8C%EC%84%B8%EC%BD%94+%ED%8A%B9%EC%A7%95%EC%A3%BC');
  const html = await res.text();
  const $ = cheerio.load(html);
  const results = [];
  $('.news_tit').each((i, el) => {
    results.push($(el).text());
  });
  console.log(results);
}
run();
