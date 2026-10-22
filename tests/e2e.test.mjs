import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname); const OUT = process.argv[2] || fs.mkdtempSync('/tmp/kian-shots-');
const vercel = JSON.parse(fs.readFileSync(ROOT + '/vercel.json'));
const globalHeaders = vercel.headers.find(h => h.source === '/(.*)').headers;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let p = decodeURIComponent(u.pathname);
  for (const h of globalHeaders) res.setHeader(h.key, h.value);
  let f = path.join(ROOT, p);
  if (!(fs.existsSync(f) && fs.statSync(f).isFile())) f = ROOT + '/index.html';
  res.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f));
}).listen(4173);

// ---- Firestore REST mock ----
const enc = v => typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : v instanceof Date ? { timestampValue: v.toISOString() } : { stringValue: String(v) };
const fsDoc = (coll, id, o) => ({ name: `projects/p/databases/(default)/documents/${coll}/${id}`, fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)])) });
const DATA = {
  articles: [
    ['a1', { title: 'دليل بناء موقع ناجح', slug: 'build-site', description: 'خطوات عملية لبناء موقعك', category: 'web', published: true, createdAt: new Date('2026-09-20T10:00:00Z'), updatedAt: new Date('2026-10-01T10:00:00Z'),
      content: '# المقدمة\nهذا نص **مهم** و *مائل* مع `كود`.\nسطر ثانٍ في نفس الفقرة.\n\n## الخطوات\n- التخطيط\n- التصميم\n- البرمجة\n\n1. أولاً\n2. ثانياً\n\n> اقتباس ملهم\n\n[تواصل معنا](/contact) و [موقع خارجي](https://example.com)\n\n<script>alert(1)</script>\n\n```\nconst x = 1;\n```' }],
    ['a2', { title: 'مقال ذو صلة بالويب', slug: 'related-web', description: 'نفس التصنيف', category: 'web', published: true, createdAt: new Date('2026-09-10') }],
    ['a3', { title: 'مقال في التصميم', slug: 'design-post', description: 'تصنيف آخر', category: 'design', published: true, createdAt: new Date('2026-09-15') }],
  ],
  services: [['s1', { title: 'تطوير المواقع', slug: 'web', description: 'مواقع سريعة', published: true }]],
  media: [], portfolio: [['w1', { title: 'متجر إلكتروني لعميل', slug: 'client-store', description: 'مشروع منفذ', published: true, createdAt: new Date('2026-09-01') }]],
  storeProducts: [['p1', { title: 'قالب متجر', slug: 'store-template', description: 'قالب احترافي', content: 'وصف **المنتج**', price: 25, currency: 'USD', category: 'templates', published: true }]],
};
const SETTINGS = { social: { whatsapp: '+967700000000', x: 'https://x.com/kian' } };

const fakeModules = {
  'firebase-app.js': `export function initializeApp(c){return {c}}`,
  'firebase-firestore.js': `export const getFirestore=()=>({});export const collection=(db,name)=>({name});export const serverTimestamp=()=>({__st:true});export const query=(...a)=>a;export const where=()=>({});export const limit=()=>({});
export async function addDoc(c,d){(globalThis.__writes||=[]).push({c:c.name,d:JSON.parse(JSON.stringify(d))});if(globalThis.__failWrite){const e=new Error('Missing or insufficient permissions.');e.code='permission-denied';throw e}return {id:'new1'}}
export async function getDocs(){return {docs:[],empty:true,forEach(){}}}`,
  'firebase-auth.js': `export function getAuth(){return globalThis.__auth||(globalThis.__auth={currentUser:globalThis.__mockUser||null,languageCode:null})}
export function onAuthStateChanged(a,cb){setTimeout(()=>cb(a.currentUser),0);return()=>{}}
export async function sendPasswordResetEmail(a,e){(globalThis.__resets||=[]).push({e,lang:a.languageCode})}
export async function signInWithEmailAndPassword(){const e=new Error('Firebase: Error (auth/invalid-credential).');e.code='auth/invalid-credential';throw e}
export async function createUserWithEmailAndPassword(){const e=new Error('x');e.code='auth/weak-password';throw e}
export async function signOut(){}`,
  'firebase-functions.js': `export const getFunctions=()=>({});export const httpsCallable=()=>async()=>({data:{}});`,
};

const browser = await chromium.launch();
let failures = 0; const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) failures++; };

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, colorScheme: opts.dark ? 'dark' : 'light', locale: 'ar' });
  await ctx.addInitScript(([u, d]) => { if (u) globalThis.__mockUser = u; if (d) try { localStorage.setItem('kian_theme', 'd') } catch {} }, [opts.user || null, !!opts.dark]);
  await ctx.route('https://www.gstatic.com/**', r => { const n = r.request().url().split('/').pop(); r.fulfill({ status: 200, contentType: 'text/javascript', body: fakeModules[n] || '' }); });
  await ctx.route('https://firestore.googleapis.com/**', async r => {
    const url = r.request().url();
    if (url.includes(':runQuery')) {
      const sq = JSON.parse(r.request().postData()).structuredQuery; const coll = sq.from[0].collectionId;
      const flt = sq.where ? (sq.where.compositeFilter ? sq.where.compositeFilter.filters : [sq.where]) : [];
      let rows = (DATA[coll] || []).filter(([id, o]) => flt.every(f => { const ff = f.fieldFilter; const want = Object.values(ff.value)[0]; return String(o[ff.field.fieldPath]) === String(want); }));
      rows = rows.slice(0, sq.limit || 100);
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify(rows.length ? rows.map(([id, o]) => ({ document: fsDoc(coll, id, o) })) : [{ readTime: 'x' }]) });
    }
    if (url.includes('/siteSettings/main')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fields: { social: { mapValue: { fields: { whatsapp: { stringValue: SETTINGS.social.whatsapp }, x: { stringValue: SETTINGS.social.x } } } }, heroButton: { stringValue: 'استكشف منتجاتنا' }, heroButtonUrl: { stringValue: '/products' }, productCategories: { mapValue: { fields: { templates: { mapValue: { fields: { title: { stringValue: 'قوالب جاهزة' }, description: { stringValue: 'وصف معدّل من اللوحة' } } } } } } } } }) });
    return r.fulfill({ status: 404, body: '{}' });
  });
  const page = await ctx.newPage(); page.__errors = [];
  page.on('pageerror', e => page.__errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') page.__errors.push('console: ' + m.text()); });
  return page;
}
const B = 'http://localhost:4173';

console.log('Home');
{ const p = await newPage(); await p.goto(B + '/'); await p.waitForSelector('#home-articles .card');
  ok((await p.textContent('#footer')).includes(String(new Date().getFullYear())), 'footer shows current year');
  ok(await p.getAttribute('meta[property="og:image"]', 'content') === 'http://localhost:4173/og-default.png', 'default og:image applied by meta()');
  ok(await p.$('link[rel=manifest]') && await p.$('link[rel="apple-touch-icon"]'), 'manifest + apple icon linked');
  for (const a of ['/favicon.svg', '/favicon.ico', '/manifest.webmanifest', '/og-default.png', '/icon-512.png']) { const r = await p.request.get(B + a); ok(r.status() === 200 && !(await r.text()).startsWith('<!doctype'), 'asset served: ' + a); }
  const ld = JSON.parse(await p.textContent('#schema')); ok(ld.logo && ld.sameAs?.[0] === 'https://x.com/kian' && !ld.sameAs.some(s => s.includes('wa.me')), 'Organization schema has logo + sameAs');
  await p.waitForSelector('#home-products .card'); ok(await p.$('#home-products a[href="/products/store-template"]') && (await p.textContent('#home-products')).includes('USD 25'), 'home shows real products with price');
  ok(await p.getAttribute('#hero-button', 'href') === '/products' && (await p.textContent('#hero-button')) === 'استكشف منتجاتنا', 'hero button respects admin settings (/products)');
  ok(await p.$('#navlinks a[href="/products"]') && await p.$('#tabbar a[href="/products"]'), 'products link in top menu + bottom bar');
  await p.waitForSelector('#home-media .card'); ok(await p.$('#home-media a[href="/portfolio/client-store"]') && await p.getAttribute('#media-title + a.more', 'href') === '/portfolio', 'portfolio items shown in home works section');
  ok(p.__errors.length === 0, 'no console/CSP errors: ' + p.__errors.join(' | '));
  await p.screenshot({ path: OUT + '/home.png' }); }

console.log('Portfolio');
{ const p = await newPage(); await p.goto(B + '/portfolio'); await p.waitForSelector('#portfolio-grid .card'); ok(await p.$('#portfolio-grid a[href="/portfolio/client-store"]'), 'portfolio page lists item');
  await p.goto(B + '/portfolio/client-store'); await p.waitForSelector('.content-body'); ok((await p.textContent('h1')).includes('متجر إلكتروني لعميل'), 'portfolio detail page');
  ok(p.__errors.length === 0, 'no errors: ' + p.__errors.join(' | ')); }

console.log('Products page');
{ const p = await newPage(); await p.goto(B + '/products'); await p.waitForSelector('#products-by-cat .card'); ok(await p.$('#products-by-cat a[href="/products/store-template"]'), 'products page lists product under its category');
  const heads = await p.$$eval('#products-by-cat h2', e => e.map(x => x.textContent)); ok(heads.length === 1 && heads[0] === 'قوالب جاهزة' && (await p.textContent('#products-by-cat')).includes('وصف معدّل من اللوحة'), 'only non-empty categories shown, with admin-edited name: ' + heads.join(','));
  await p.goto(B + '/products/templates'); await p.waitForSelector('#category-products .card'); ok((await p.textContent('h1')) === 'قوالب جاهزة', 'category page uses edited name');
  ok(p.__errors.length === 0, 'no errors: ' + p.__errors.join(' | '));
  const m = await newPage({ mobile: true }); await m.goto(B + '/products'); await m.waitForSelector('#products-by-cat .card'); ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow mobile /products (6-item bottom bar)'); await m.screenshot({ path: OUT + '/products-mobile.png' }); }

console.log('Article');
{ const p = await newPage(); await p.goto(B + '/articles/build-site'); await p.waitForSelector('.content-body.md h2');
  const html = await p.innerHTML('.content-body.md');
  ok(html.includes('<h2>المقدمة</h2>') && html.includes('<h3>الخطوات</h3>'), 'markdown headings');
  ok(html.includes('<strong>مهم</strong>') && html.includes('<em>مائل</em>') && html.includes('<code>كود</code>'), 'inline formatting');
  ok((await p.$$('.content-body ul li')).length === 3 && (await p.$$('.content-body ol li')).length === 2, 'lists');
  ok(await p.$('.content-body blockquote') && await p.$('.content-body pre code'), 'quote + code block');
  ok(!(await p.$('.content-body script')) && html.includes('&lt;script&gt;'), 'raw HTML escaped (no XSS)');
  ok(await p.getAttribute('.content-body a[href="https://example.com"]', 'rel') === 'noopener noreferrer', 'external link safe');
  ok(/قراءة/.test(await p.textContent('.post-meta')) && await p.getAttribute('.post-meta time', 'datetime') === '2026-09-20T10:00:00.000Z', 'date + reading time');
  ok((await p.$$('.share a')).length === 5 && (await p.getAttribute('.share a', 'href')).startsWith('https://wa.me/?text='), 'share bar');
  await p.waitForSelector('#related .card'); const rel = await p.$$eval('#related h3', e => e.map(x => x.textContent));
  ok(rel.length === 2 && rel[0] === 'مقال ذو صلة بالويب' && !rel.includes('دليل بناء موقع ناجح'), 'related: same category first, excludes self → ' + rel.join(' / '));
  const ld = JSON.parse(await p.textContent('#schema')); ok(ld['@type'] === 'Article' && ld.headline && ld.datePublished && ld.dateModified && ld.publisher?.logo, 'Article JSON-LD complete');
  ok(await p.getAttribute('meta[property="og:image"]', 'content') === 'http://localhost:4173/og-default.png', 'article without image → default og:image');
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']); await p.click('.share-copy'); ok(await p.waitForFunction(() => document.querySelector('.share-copy').textContent.includes('تم النسخ'), null, { timeout: 3000 }).then(() => true, () => false), 'copy link works'); ok(await p.evaluate(() => navigator.clipboard.readText()) === 'http://localhost:4173/articles/build-site', 'copied URL is clean canonical');
  ok(p.__errors.length === 0, 'no console/CSP errors: ' + p.__errors.join(' | '));
  await p.screenshot({ path: OUT + '/article.png', fullPage: true }); }
{ const p = await newPage({ dark: true, mobile: true }); await p.goto(B + '/articles/build-site'); await p.waitForSelector('#related .card'); await p.screenshot({ path: OUT + '/article-dark-mobile.png', fullPage: true }); }

console.log('Product order');
{ const p = await newPage(); await p.goto(B + '/products/store-template'); await p.waitForSelector('#order-form');
  await p.click('#request-product'); ok((await p.textContent('#order-msg')).includes('بلدك'), 'empty country rejected');
  await p.fill('#o-country', 'اليمن'); await p.click('#request-product'); await p.waitForFunction(() => document.querySelector('#order-msg').textContent.includes('تسجيل الدخول'));
  ok(await p.$('#order-msg a[href="/#account"]'), 'anonymous → login prompt');
  ok(await p.evaluate(() => sessionStorage.getItem('kian_return')) === '/products/store-template', 'return path saved');
  ok(!(await p.evaluate(() => globalThis.__writes)), 'nothing written when logged out');
  ok(p.__errors.length === 0, 'no errors: ' + p.__errors.join(' | ')); }
{ const p = await newPage({ user: { uid: 'alice', email: 'alice@x.com' } }); await p.goto(B + '/products/store-template'); await p.waitForSelector('#order-form');
  await p.screenshot({ path: OUT + '/product.png', fullPage: true });
  await p.fill('#o-country', 'السعودية'); await p.fill('#o-company', 'شركة'); await p.fill('#o-message', 'أحتاج تخصيصاً'); await p.click('#request-product');
  await p.waitForSelector('#order-form .notice.ok'); const w = await p.evaluate(() => globalThis.__writes);
  const d = w?.[0]?.d; ok(w.length === 1 && w[0].c === 'purchaseRequests', 'one purchaseRequests write');
  const allowed = ['customerUid', 'customerEmail', 'productId', 'productTitle', 'amount', 'currency', 'country', 'company', 'message', 'status', 'createdAt'];
  ok(Object.keys(d).every(k => allowed.includes(k)) && d.customerUid === 'alice' && d.customerEmail === 'alice@x.com' && d.productId === 'p1' && d.amount === 25 && d.status === 'new' && d.createdAt.__st && d.country === 'السعودية', 'payload matches rules: ' + JSON.stringify(d));
  ok((await p.textContent('.notice.ok')).includes('alice@x.com'), 'success message'); }
{ const p = await newPage({ user: { uid: 'alice', email: 'alice@x.com' } }); await p.addInitScript(() => { globalThis.__failWrite = true }); await p.goto(B + '/products/store-template'); await p.waitForSelector('#order-form');
  await p.fill('#o-country', 'مصر'); await p.click('#request-product'); await p.waitForFunction(() => document.querySelector('#order-msg').textContent.includes('تعذر'));
  ok(await p.isEnabled('#request-product'), 'denied write → error shown, button re-enabled'); }

console.log('Contact');
{ const p = await newPage(); await p.goto(B + '/contact'); await p.waitForSelector('#contact-form');
  ok(await p.getAttribute('.alt-contact a', 'href') === 'https://wa.me/967700000000', 'WhatsApp alternative link');
  await p.click('#c-send'); ok((await p.textContent('#c-msg')).includes('اسمك'), 'name required');
  await p.fill('#c-name', 'أحمد'); await p.fill('#c-email', 'bad'); await p.click('#c-send'); ok((await p.textContent('#c-msg')).includes('بريداً'), 'email validated');
  await p.fill('#c-email', 'ahmed@mail.com'); await p.fill('#c-message', 'قصير'); await p.click('#c-send'); ok((await p.textContent('#c-msg')).includes('10'), 'message min length');
  await p.fill('#c-message', 'أريد تصميم موقع لشركتي'); await p.fill('#c-phone', '+967700'); await p.click('#c-send');
  await p.waitForSelector('#contact-form .notice.ok'); const w = await p.evaluate(() => globalThis.__writes); const d = w[0].d;
  const allowed = ['name', 'email', 'phone', 'subject', 'message', 'status', 'createdAt', 'uid', 'page'];
  ok(w.length === 1 && w[0].c === 'contactMessages' && Object.keys(d).every(k => allowed.includes(k)) && d.status === 'new' && d.createdAt.__st && !('uid' in d), 'contact payload matches rules: ' + JSON.stringify(d));
  await p.screenshot({ path: OUT + '/contact-done.png' });
  await p.goto(B + '/contact'); await p.waitForSelector('#contact-form'); await p.fill('#c-name', 'أحمد'); await p.fill('#c-email', 'ahmed@mail.com'); await p.fill('#c-message', 'رسالة ثانية مباشرة'); await p.click('#c-send');
  ok((await p.textContent('#c-msg')).includes('انتظر'), 'rate limit 60s');
  ok(p.__errors.length === 0, 'no errors: ' + p.__errors.join(' | ')); }
{ const p = await newPage(); await p.goto(B + '/contact'); await p.waitForSelector('#contact-form'); await p.screenshot({ path: OUT + '/contact.png', fullPage: true });
  await p.fill('#c-name', 'بوت'); await p.fill('#c-email', 'b@b.co'); await p.fill('#c-message', 'spam spam spam'); await p.evaluate(() => { document.getElementById('c-website').value = 'http://spam' }); await p.click('#c-send');
  ok(await p.$('.notice.ok') && !(await p.evaluate(() => globalThis.__writes)), 'honeypot: fake success, nothing written'); }

console.log('Account');
{ const p = await newPage(); await p.goto(B + '/#account'); await p.waitForSelector('#reset');
  await p.click('#reset'); ok((await p.textContent('#auth-msg')).includes('اكتب بريدك'), 'reset needs email');
  await p.fill('#email', 'me@x.com'); await p.click('#reset'); await p.waitForFunction(() => document.querySelector('#auth-msg').textContent.includes('إعادة تعيين'));
  const r = await p.evaluate(() => globalThis.__resets); ok(r?.[0]?.e === 'me@x.com' && r[0].lang === 'ar', 'reset email sent in Arabic');
  await p.fill('#password', 'x'); await p.click('#login'); await p.waitForFunction(() => document.querySelector('#auth-msg').textContent.includes('فشل'));
  ok((await p.textContent('#auth-msg')).includes('غير صحيحة'), 'Arabic login error'); }
{ const p = await newPage({ user: { uid: 'alice', email: 'alice@x.com' } }); await p.addInitScript(() => sessionStorage.setItem('kian_return', '/products/store-template')); await p.goto(B + '/#account');
  await p.waitForSelector('#auth-msg a'); ok(await p.getAttribute('#auth-msg a', 'href') === '/products/store-template', 'return-to-product link after login'); }

console.log('Layout overflow');
for (const mobile of [false, true]) { const p = await newPage({ mobile }); for (const u of ['/', '/contact', '/articles/build-site', '/products/store-template', '/#account', '/about']) { await p.goto(B + u); await p.waitForTimeout(500); const [sw, cw] = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(sw <= cw, `no horizontal overflow ${mobile ? 'mobile' : 'desktop'} ${u} (${sw}/${cw})`); } }
{ const p = await newPage(); await p.goto(B + '/'); await p.waitForSelector('#social a'); ok((await p.$$eval('#social a', e => e.map(x => x.textContent))).join(',') === 'واتساب,إكس', 'Arabic social labels'); }
console.log('Static pages');
{ const p = await newPage(); for (const u of ['/about', '/services', '/services/design', '/portfolio', '/no-such-page']) { await p.goto(B + u); await p.waitForTimeout(400); }
  ok(p.__errors.length === 0, 'no errors on static pages: ' + p.__errors.join(' | ')); }

await browser.close(); server.close();
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED'); process.exit(failures ? 1 : 0);
