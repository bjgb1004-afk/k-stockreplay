export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const market = searchParams.get('market') === 'US' ? 'US' : 'KR';
  if (!q) return new Response('q is required', { status: 400 });

  const locale = market === 'US' ? { hl: 'en-US', gl: 'US', ceid: 'US:en' } : { hl: 'ko', gl: 'KR', ceid: 'KR:ko' };
  const rssUrl = new URL('https://news.google.com/rss/search');
  rssUrl.searchParams.set('q', q);
  rssUrl.searchParams.set('hl', locale.hl);
  rssUrl.searchParams.set('gl', locale.gl);
  rssUrl.searchParams.set('ceid', locale.ceid);

  const res = await fetch(rssUrl);
  if (!res.ok) return new Response('upstream fetch failed', { status: 502 });
  const xml = await res.text();

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 15).map((m) => {
    const block = m[1];
    const title = /<title>([\s\S]*?)<\/title>/.exec(block)?.[1] ?? '';
    const link = /<link>([\s\S]*?)<\/link>/.exec(block)?.[1] ?? '';
    const pubDate = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1] ?? '';
    return { title: decodeXmlEntities(title), link, pubDate };
  });

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
  });
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
