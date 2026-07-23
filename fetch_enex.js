import * as cheerio from 'cheerio';
async function run() {
  const res = await fetch('https://contents.premium.naver.com/a18382/prism/contents/260717112936379nm');
  const html = await res.text();
  const $ = cheerio.load(html);
  console.log($('body').text().replace(/\s+/g, ' ').substring(0, 3000));
}
run();
