import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export async function getNaverConditionStocks(): Promise<string[]> {
  // 1. Rising Top 100
  const rUrl = 'https://finance.naver.com/sise/sise_rise.naver';
  const rRes = await fetch(rUrl);
  const rBuffer = await rRes.arrayBuffer();
  const rHtml = iconv.decode(Buffer.from(rBuffer), 'euc-kr');
  const $r = cheerio.load(rHtml);
  
  const risingTop100: string[] = [];
  $r('a.tltle').each((i, el) => {
    if (risingTop100.length >= 100) return;
    const href = $r(el).attr('href');
    if (href) {
      const match = href.match(/code=(\d+)/);
      if (match) risingTop100.push(match[1]);
    }
  });

  // 2. Volume Top 200 (Page 1 and Page 2? sise_quant only has 100 items per page?)
  // Actually, wait, let's just fetch KOSPI and KOSDAQ if page is not supported.
  // wait, sise_quant supports page=1, page=2 ? let's check.
}
