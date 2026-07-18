import * as cheerio from 'cheerio';
async function run() {
  const res = await fetch('https://search.naver.com/search.naver?query="2026%EB%85%84+7%EC%9B%94+16%EC%9D%BC"+%ED%8A%B9%EC%A7%95%EC%A3%BC+%EC%83%81%ED%95%9C%EA%B0%80');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  $('.total_tit, .news_tit, .dsc_txt').each((i, el) => {
    console.log($(el).text());
  });
}
run();
