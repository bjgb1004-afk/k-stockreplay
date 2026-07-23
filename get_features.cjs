const cheerio = require('cheerio');
async function run() {
  try {
    const res = await fetch('https://search.naver.com/search.naver?query=%ED%8A%B9%EC%A7%95%EC%A3%BC&nso=so%3Add%2Cp%3Afrom20240716to20240716%2Ca%3Aall');
    const html = await res.text();
    const $ = cheerio.load(html);
    const results = [];
    $('.news_tit').each((i, el) => {
      results.push($(el).text());
    });
    console.log(results);
  } catch(e) { console.error(e); }
}
run();
