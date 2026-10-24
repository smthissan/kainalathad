// يفحص api/og.js (محتوى جاهز لروبوتات البحث) و api/_md.js (مطابقة md() في index.html).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { md } from '../api/_md.js';
import { GET } from '../api/og.js';

const R = new URL('../', import.meta.url).pathname;
const index = readFileSync(R + 'index.html', 'utf8');
const grab = (re) => index.match(re)[0];
const clientMd = new Function(`${grab(/function esc\(v\)\{.*\}\n/)}\n${grab(/function inl\(t\)\{.*\}\n/)}\n${grab(/function md\(src\)\{.*\}\n/)}\nreturn md`)();

const SAMPLE = [
  '# مقدمة', 'نص **غامق** و *مائل* و `كود` ورابط [الأكاديمية](/learn) و [خارجي](https://example.com).', '',
  '## فرعي', '- أ', '- ب', '', '1. واحد', '2. اثنان', '', '> تنبيه <b>x</b>', '', '```js', 'const a = "<tag>";', '```', '', '---', '![صورة](https://example.com/a.png)',
].join('\n');

test('server md() matches the client md()', () => {
  assert.equal(md(SAMPLE), clientMd(SAMPLE));
  assert.equal(md(''), clientMd(''));
  assert.equal(md(undefined), clientMd(undefined));
});

const f = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? { integerValue: String(v) } : { stringValue: v }]));
function stub(doc) {
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith('/index.html')) return new Response(index, { status: 200 });
    if (u.includes(':runQuery')) return new Response(JSON.stringify(doc ? [{ document: { fields: f(doc) } }] : [{}]), { status: 200 });
    return new Response('{}', { status: 404 });
  };
}
const req = (c, slug) => new Request(`https://kianalathad.com/api/og?c=${c}&slug=${encodeURIComponent(slug)}`);

test('lesson: full content is rendered inside <main> for crawlers', async () => {
  stub({ title: 'درس تجريبي', slug: 's1', published: true, description: 'وصف الدرس', content: SAMPLE, imageUrl: 'https://img.example/x.jpg' });
  const r = await GET(req('articles', 's1')); const h = await r.text();
  assert.equal(r.status, 200);
  const main = h.match(/<main id="app">([\s\S]*?)<\/main>/)[1];
  assert.match(main, /<h1>درس تجريبي<\/h1>/);
  assert.match(main, /<h2>مقدمة<\/h2>/);
  assert.match(main, /<a href="\/learn">الأكاديمية<\/a>/);
  assert.match(main, /<ul><li>أ<\/li><li>ب<\/li><\/ul>/);
  assert.ok(!main.includes('<b>x</b>') && main.includes('&lt;b&gt;x&lt;/b&gt;'), 'HTML in content is escaped');
  assert.ok(!main.includes('class="card sk"'), 'loading skeleton removed');
  assert.match(h, /<link rel="canonical" href="https:\/\/kianalathad\.com\/articles\/s1">/);
  assert.equal((h.match(/<main id="app">/g) || []).length, 1);
  assert.ok(h.includes('</footer>') && h.includes('id="tabbar"'), 'rest of the page intact');
});

test('title/description injection is escaped', async () => {
  stub({ title: '"><script>alert(1)</script>', slug: 's2', published: true, description: '<img src=x onerror=1>', content: 'نص' });
  const h = await (await GET(req('articles', 's2'))).text();
  const main = h.match(/<main id="app">([\s\S]*?)<\/main>/)[1];
  assert.ok(!/<script>alert|<img src=x/.test(main));
});

test('missing doc: real 404 with the original page, short cache', async () => {
  stub(null);
  const r = await GET(req('articles', 'nope'));
  assert.equal(r.status, 404);
  assert.equal(await r.text(), index);
  assert.match(r.headers.get('cache-control'), /s-maxage=60$/);
});

test('crawler pages carry og:locale ar_AR exactly once', async () => {
  stub({ title: 'درس', slug: 's3', published: true, description: 'وصف', content: 'نص' });
  const h = await (await GET(req('articles', 's3'))).text();
  assert.equal((h.match(/property="og:locale"/g) || []).length, 1);
  assert.match(h, /<meta property="og:locale" content="ar_AR">/);
});

test('unreachable template gives 503', async () => {
  globalThis.fetch = async () => { throw new Error('down'); };
  assert.equal((await GET(req('articles', 's1'))).status, 503);
});

const listReq = (name) => new Request(`https://kianalathad.com/api/og?list=${name}`);
function stubList(docs) {
  globalThis.fetch = async (url, opts) => {
    const u = String(url);
    if (u.endsWith('/index.html')) return new Response(index, { status: 200 });
    if (u.includes(':runQuery')) {
      const coll = JSON.parse(opts.body).structuredQuery.from[0].collectionId;
      return new Response(JSON.stringify((docs[coll] || []).map((d, i) => ({ document: { name: `projects/p/databases/(default)/documents/${coll}/id${i}`, fields: f(d) } }))), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };
}

test('list page: links to published items and own title/canonical for crawlers', async () => {
  stubList({ articles: [{ title: 'مقال أول', slug: 'first', description: 'وصف <b>' }, { title: 'بدون slug' }] });
  const r = await GET(listReq('articles')); const h = await r.text();
  assert.equal(r.status, 200);
  const main = h.match(/<main id="app">([\s\S]*?)<\/main>/)[1];
  assert.match(main, /<h1>المقالات<\/h1>/);
  assert.match(main, /<a href="\/articles\/first">مقال أول<\/a>/);
  assert.match(main, /<a href="\/articles\/id1">بدون slug<\/a>/);
  assert.ok(main.includes('وصف &lt;b&gt;'));
  assert.match(h, /<title>المقالات \| كيان للبرمجيات<\/title>/);
  assert.match(h, /<link rel="canonical" href="https:\/\/kianalathad\.com\/articles">/);
  assert.equal((h.match(/<link rel="canonical"/g) || []).length, 1);
  assert.equal((h.match(/property="og:locale"/g) || []).length, 1);
});

test('services list includes the fixed service pages', async () => {
  stubList({});
  const main = (await (await GET(listReq('services'))).text()).match(/<main id="app">([\s\S]*?)<\/main>/)[1];
  assert.match(main, /<a href="\/services\/web-development">تطوير المواقع<\/a>/);
});

test('list page: Firestore failure returns the original page uncached', async () => {
  globalThis.fetch = async (url) => (String(url).endsWith('/index.html') ? new Response(index, { status: 200 }) : new Response('x', { status: 500 }));
  const r = await GET(listReq('media'));
  assert.equal(await r.text(), index);
  assert.equal(r.headers.get('cache-control'), 'no-store');
});

test('route titles in api/og.js match routeSeo in index.html', async () => {
  for (const p of ['articles', 'services', 'media', 'portfolio', 'products']) {
    stubList({});
    const h = await (await GET(listReq(p))).text();
    const [, t, d] = index.match(new RegExp(`'/${p}':\\['([^']+)','([^']+)'`));
    assert.ok(h.includes(`<title>${t} | كيان للبرمجيات</title>`), p);
    assert.ok(h.includes(`<meta name="description" content="${d}">`), p);
  }
});
