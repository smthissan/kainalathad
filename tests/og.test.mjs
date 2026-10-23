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

test('missing doc returns the original page untouched', async () => {
  stub(null);
  const h = await (await GET(req('articles', 'nope'))).text();
  assert.equal(h, index);
});

test('unreachable template gives 503', async () => {
  globalThis.fetch = async () => { throw new Error('down'); };
  assert.equal((await GET(req('articles', 's1'))).status, 503);
});
