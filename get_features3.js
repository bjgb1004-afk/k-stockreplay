import * as cheerio from 'cheerio';
async function run() {
  const res = await fetch('https://search.naver.com/search.naver?where=blog&query=2024%EB%85%84+7%EC%9B%94+16%EC%9D%BC+%ED%8A%B9%EC%A7%95%EC%A3%BC+%EC%83%81%ED%95%9C%EA%B0%80');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  $('.title_link').each((i, el) => {
    console.log($(el).text());
  });
  $('.api_txt_lines.dsc_txt').each((i, el) => {
    console.log($(el).text());
  });
}
run();
