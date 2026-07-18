import * as cheerio from 'cheerio';
import * as fs from 'fs';
async function run() {
  const html = fs.readFileSync('naver.html', 'utf-8');
  const $ = cheerio.load(html);
  $('.api_txt_lines.total_tit').each((i, el) => {
    console.log($(el).text());
  });
}
run();
