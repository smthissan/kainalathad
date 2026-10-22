import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs';
const server = http.createServer((q, r) => { r.setHeader('content-type', 'text/html; charset=utf-8'); r.end(fs.readFileSync(new URL('../admin.html', import.meta.url))); }).listen(4174);
const OUT = process.argv[2] || fs.mkdtempSync('/tmp/kian-admin-');
const ts = (iso) => `({toDate:()=>new Date('${iso}')})`;
const mods = {
  'firebase-app.js': `export const initializeApp=()=>({});`,
  'firebase-storage.js': `export const getStorage=()=>({}),ref=(s,p)=>({p}),uploadBytes=async(r,f,m)=>{globalThis.__ops.push(['upload',r.p,m.contentType])},getDownloadURL=async()=>'',deleteObject=async()=>{};`,
  'firebase-auth.js': `export const getAuth=()=>({});export const signInWithEmailAndPassword=async()=>{},signOut=async()=>{};export function onAuthStateChanged(a,cb){setTimeout(()=>cb({uid:'adm',email:'smthysan@gmail.com'}),0)}`,
  'firebase-firestore.js': `globalThis.__ops=[];const MSGS=[{id:'m1',d:{name:'أحمد',email:'a@b.co',phone:'+9677',subject:'موقع',message:'أريد موقعاً\\nسطر 2',status:'new',createdAt:${ts('2026-10-10T10:00:00Z')}}},{id:'m2',d:{name:'<b>x</b>',email:'x@y.z',message:'تمت',status:'replied',createdAt:${ts('2026-10-09T10:00:00Z')}}}];
export const getFirestore=()=>({}),collection=(db,n)=>({n}),doc=(db,c,i)=>({c,i}),query=(c)=>c,limit=()=>0,orderBy=()=>0,serverTimestamp=()=>'ST';
const LISTS={storeProducts:[{id:'p1',d:{title:'قالب متجر',slug:'store-template',published:true}},{id:'p2',d:{title:'منتج مسودة',slug:'draft-prod',published:false}}],services:[{id:'s1',d:{title:'تطوير تطبيقات',slug:'apps-svc',published:true}}],articles:[{id:'a1',d:{title:'درس قديم',slug:'old-lesson',published:true,track:'websites',relatedProduct:'gone-prod',relatedService:'web-development'}},{id:'e1',d:{title:'قديم',slug:'free-website-options',published:false,createdAt:'2026-01-01T00:00:00Z',imageUrl:'https://img.example/old.jpg',imagePath:'articles/e1/preview/old'}}]};
export async function getDocs(c){const docs=c.n==='contactMessages'?MSGS.filter(m=>!globalThis.__deleted?.includes(m.id)).map(m=>({id:m.id,data:()=>m.d})):(LISTS[c.n]||[]).map(m=>({id:m.id,data:()=>m.d}));return {docs,empty:!docs.length,forEach:f=>docs.forEach(f)}}
export async function getDoc(){return {data:()=>({}),exists:()=>true}}
export async function updateDoc(r,d){__ops.push(['update',r.c,r.i,d.status]);const m=MSGS.find(x=>x.id===r.i);if(m)m.d.status=d.status}
export async function deleteDoc(r){__ops.push(['delete',r.c,r.i]);(globalThis.__deleted||=[]).push(r.i)}
export async function setDoc(r,d){__ops.push(['set',r.c,d.fileContentType,d.privateFilePath,d.productCategories?JSON.stringify(d.productCategories):undefined,d.track!==undefined?JSON.stringify({track:d.track,relatedProduct:d.relatedProduct,relatedService:d.relatedService}):undefined,JSON.stringify(d),r.i])} export async function addDoc(c,d){__ops.push(['add',c.n,d.action])}`,
};
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } }); const errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
await p.route('https://www.gstatic.com/**', r => r.fulfill({ contentType: 'text/javascript', body: mods[r.request().url().split('/').pop()] }));
const BUNDLE = JSON.parse(fs.readFileSync(new URL('../academy-import/bundle.json', import.meta.url), 'utf8')); let BUNDLE_SERVED = JSON.parse(JSON.stringify(BUNDLE)), BUNDLE_STATUS = 200; BUNDLE_SERVED.lessons.forEach(l => delete l.cover); const IMG = Buffer.from('JPEGDATA');
await p.route('**/academy-import/**', r => { const u = r.request().url(); if (u.endsWith('/bundle.json')) return BUNDLE_STATUS === 200 ? r.fulfill({ contentType: 'application/json', body: JSON.stringify(BUNDLE_SERVED) }) : r.fulfill({ status: BUNDLE_STATUS, body: 'x' }); if (u.includes('/covers/')) return r.fulfill({ contentType: 'image/jpeg', body: IMG }); return r.fulfill({ status: 404, body: '' }); });
let fail = 0; const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fail++; };
await p.goto('http://localhost:4174/'); await p.waitForSelector('#messages .item');
ok((await p.$$('#messages .item')).length === 2, 'two messages listed');
ok((await p.textContent('#messages-count')).includes('1'), 'unread counter = 1');
ok(!(await p.$('#messages b')) && (await p.textContent('#messages')).includes('<b>x</b>'), 'names escaped');
ok((await p.getAttribute('#messages .button-link', 'href')).startsWith('mailto:a%40b.co?subject='), 'mailto reply link');
await p.selectOption('#messages-filter', 'new'); await p.waitForTimeout(200); ok((await p.$$('#messages .item')).length === 1, 'filter new');
await p.selectOption('#messages-filter', ''); await p.waitForTimeout(200);
const first = (await p.$$('#messages .item'))[0]; await (await first.$('select')).selectOption('read'); await (await first.$$('button'))[0].click(); await p.waitForTimeout(300);
ok(JSON.stringify(await p.evaluate(() => __ops)).includes('["update","contactMessages","m1","read"]'), 'status update saved + logged: ' + JSON.stringify(await p.evaluate(() => __ops)));
ok((await p.textContent('#messages-count')) === '', 'counter cleared after read');
await (await (await p.$$('#messages .item'))[1].$('button.danger')).click(); await p.waitForTimeout(300);
ok((await p.$$('#messages .item')).length === 1, 'delete works');
ok((await p.textContent('#dashboard')).includes('يدعم تنسيق Markdown'), 'markdown hint visible');
console.log('Private file upload');
const PDF = Buffer.from('%PDF-1.7\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\n');
async function saveProduct(file) {
  await p.evaluate(() => { __ops.length = 0; }); await p.click('#new'); await p.selectOption('#kind', 'storeProducts');
  await p.fill('#title', 'كتاب تعلم النقش'); await p.fill('#price', '5'); await p.selectOption('#category', 'ebooks'); await p.selectOption('#productType', 'Ebook');
  await p.setInputFiles('#private-file', file); await p.click('#save'); await p.waitForTimeout(300);
  return { msg: await p.textContent('#content-msg'), ops: await p.evaluate(() => __ops) };
}
for (const [label, file] of [['PDF reported as octet-stream', { name: 'book.pdf', mimeType: 'application/octet-stream', buffer: PDF }], ['PDF with no extension', { name: 'book', mimeType: '', buffer: PDF }], ['PDF with uppercase extension', { name: 'BOOK.PDF', mimeType: 'application/pdf', buffer: PDF }]]) {
  const r = await saveProduct(file); const up = r.ops.find(o => o[0] === 'upload' && o[1].includes('/file/')); const set = r.ops.find(o => o[0] === 'set');
  ok(r.msg.includes('تم الحفظ') && up && up[1].endsWith('.pdf') && up[2] === 'application/pdf' && set?.[2] === 'application/pdf', label + ' → accepted as PDF: ' + r.msg + ' ' + JSON.stringify(r.ops));
}
{ const r = await saveProduct({ name: 'fake.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html>not a pdf</html>') });
  ok(r.msg.includes('fake.pdf') && !r.ops.some(o => o[0] === 'upload' || o[0] === 'set'), 'non-PDF content renamed .pdf → rejected, nothing saved: ' + r.msg); }
{ const r = await saveProduct({ name: 'app.apk', mimeType: '', buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]) }); const up = r.ops.find(o => o[0] === 'upload');
  ok(up && up[1].endsWith('.apk') && up[2] === 'application/vnd.android.package-archive', 'APK still accepted'); }
console.log('Product categories');
ok((await p.$$('#cats .item')).length === 5, 'five product categories editable');
await p.evaluate(() => { __ops.length = 0; }); await p.fill('#cat-title-ebooks', 'كتب تعليمية'); await p.check('#cat-hidden-scripts'); await p.click('#save-cats'); await p.waitForTimeout(300);
{ const set = (await p.evaluate(() => __ops)).find(o => o[0] === 'set' && o[1] === 'siteSettings'); const c = set && JSON.parse(set[4]);
  ok(c?.ebooks?.title === 'كتب تعليمية' && c?.scripts?.hidden === true && c?.templates?.hidden === false && (await p.textContent('#cats-msg')).includes('تم'), 'category settings saved to siteSettings'); }
await (await (await p.$$('#cats .item'))[0].$('button')).click(); await p.waitForTimeout(200);
ok(await p.inputValue('#kind') === 'storeProducts' && await p.inputValue('#category') === 'ebooks' && await p.inputValue('#productType') === 'Ebook', '"add product in this category" pre-fills the form');
console.log('Academy fields');
await p.selectOption('#kind', 'articles'); await p.waitForTimeout(300);
ok(await p.isVisible('#track') && await p.isVisible('#relProduct') && await p.isVisible('#relService'), 'lesson fields visible for articles');
ok((await p.$$('#track option')).length === 7, 'track list: 6 tracks + "no track"');
{ const po = await p.$$eval('#relProduct option', e => e.map(x => x.textContent)), so = await p.$$eval('#relService option', e => e.map(x => x.textContent));
  ok(po.includes('قالب متجر') && po.includes('منتج مسودة (مسودة)'), 'product options loaded, drafts labelled: ' + po.join(' | '));
  ok(so.includes('تطوير المواقع (صفحة ثابتة)') && so.includes('تطوير تطبيقات'), 'service options: static pages + database services'); }
await p.click('#new'); await p.fill('#title', 'درس تجريبي'); await p.selectOption('#track', 'ai'); await p.selectOption('#relProduct', 'store-template'); await p.selectOption('#relService', 'web-development');
await p.evaluate(() => { __ops.length = 0; }); await p.click('#save'); await p.waitForTimeout(400);
{ const set = (await p.evaluate(() => __ops)).find(o => o[0] === 'set' && o[1] === 'articles'); const v = set && set[5] && JSON.parse(set[5]);
  ok(v?.track === 'ai' && v.relatedProduct === 'store-template' && v.relatedService === 'web-development', 'lesson saved with track + related product/service: ' + (set && set[5])); }
await (await (await p.$$('#items .item'))[0].$('button')).click(); await p.waitForTimeout(200);
ok(await p.inputValue('#track') === 'websites' && await p.inputValue('#relService') === 'web-development' && await p.inputValue('#relProduct') === 'gone-prod' && (await p.$eval('#relProduct', e => e.selectedOptions[0].textContent)).includes('غير موجود'), 'editing a lesson restores its fields (a deleted product stays selected, flagged)');
await p.selectOption('#kind', 'storeProducts'); await p.waitForTimeout(200);
ok(!(await p.isVisible('#track')) && !(await p.isVisible('#relProduct')), 'lesson fields hidden for other content types');
// the cover files registered in the real bundle must exist and respect the spec (JPEG 1200x630, under 250KB)
{ const dims = buf => { let i = 2; while (i < buf.length) { if (buf[i] !== 0xFF) { i++; continue } const m = buf[i + 1]; if (m >= 0xC0 && m <= 0xC3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]; i += 2 + buf.readUInt16BE(i + 2); } return null; };
  const covers = BUNDLE.lessons.filter(l => l.cover); const bad = [];
  for (const l of covers) { const f = new URL('../academy-import/' + l.cover, import.meta.url); if (!fs.existsSync(f)) { bad.push(l.slug + ': missing'); continue } const buf = fs.readFileSync(f), d = dims(buf); if (buf[0] !== 0xFF || buf[1] !== 0xD8 || !d || d[0] !== 1200 || d[1] !== 630 || buf.length > 250 * 1024) bad.push(`${l.slug}: ${d && d.join('x')} ${Math.round(buf.length / 1024)}KB`); if (!l.cover.startsWith('covers/' + l.slug + '.')) bad.push(l.slug + ': cover name does not match slug'); }
  ok(covers.length >= 1 && bad.length === 0, `real cover files: ${covers.length} registered, all JPEG 1200x630 under 250KB, named by slug` + (bad.length ? ' — PROBLEMS: ' + bad.join('; ') : '')); }
console.log('Import panel');
await p.waitForSelector('#import-list .item');
{ const rows = await p.$$eval('#import-list .item', e => e.map(x => x.textContent));
  ok(rows.length === 9, 'import panel lists the 9 bundle lessons');
  ok(rows[1].includes('موجود كمسودة') && rows.filter(r => r.includes('جديد')).length === 8 && rows[1].includes('الصورة الحالية تبقى'), 'a lesson with an existing slug is flagged "will be updated" (its image stays); the rest are new'); }
const waitDone = () => p.waitForFunction(() => /تم \d+ من 9/.test(document.getElementById('import-msg').textContent), null, { timeout: 8000 });
await p.evaluate(() => { __ops.length = 0; document.getElementById('import-msg').textContent = ''; }); await p.click('#import-run'); await waitDone();
{ const ops = await p.evaluate(() => __ops); const sets = ops.filter(o => o[0] === 'set' && o[1] === 'articles'); const docs = sets.map(o => ({ id: o[7], d: JSON.parse(o[6]) }));
  ok(sets.length === 9 && docs.map(x => x.d.slug).join() === BUNDLE.lessons.map(l => l.slug).join(), 'nine lessons written, in bundle order');
  ok(docs.every((x, i) => { const L = BUNDLE.lessons[i]; return x.d.title === L.title && x.d.description === L.description && x.d.content === L.content && x.d.track === L.track && x.d.relatedService === L.relatedService && x.d.relatedProduct === L.relatedProduct && x.d.seo.title === L.seo.title && x.d.seo.description === L.seo.description && x.d.seo.keywords === L.seo.keywords && x.d.published === true && x.d.seo.canonical === '' && x.d.seo.ogImage === ''; }), 'every field equals the bundle; published; canonical and OG image empty');
  ok(docs[1].id === 'e1' && docs[1].d.createdAt === '2026-01-01T00:00:00Z' && docs[1].d.imageUrl === 'https://img.example/old.jpg' && new Set(docs.map(x => x.id)).size === 9, 'existing lesson updated in place (same id, creation date and image kept) — no duplicate');
  ok(ops.filter(o => o[0] === 'add' && o[1] === 'adminActivityLogs').length === 9 && !ops.some(o => o[0] === 'upload') && (await p.textContent('#import-msg')).includes('تم 9 من 9'), 'activity logged for each lesson; no uploads when there are no images'); }
// chosen images are matched by slug (case-insensitive extension); unmatched names are reported; draft mode
await p.setInputFiles('#import-images', [{ name: 'create-and-sell-an-ebook.jpg', mimeType: 'image/jpeg', buffer: IMG }, { name: 'where-to-start-learning-programming.PNG', mimeType: 'image/png', buffer: IMG }, { name: 'random-file.jpg', mimeType: 'image/jpeg', buffer: IMG }]);
{ const t = await p.textContent('#import-list'); ok(t.includes('random-file') && t.includes('ستُتجاهل') && t.includes('الصورة: من الملف الذي اخترته'), 'unmatched image names are reported and ignored'); }
await p.check('#import-draft'); await p.evaluate(() => { __ops.length = 0; document.getElementById('import-msg').textContent = ''; }); await p.click('#import-run'); await waitDone();
{ const ops = await p.evaluate(() => __ops), ups = ops.filter(o => o[0] === 'upload'), sets = ops.filter(o => o[0] === 'set' && o[1] === 'articles');
  ok(ups.length === 2 && ups.map(u => u[2]).sort().join() === 'image/jpeg,image/png' && ups.every(u => /^articles\/[^/]+\/preview\/[^/]+$/.test(u[1])), 'two images uploaded to articles/<id>/preview/ with the right content types: ' + ups.map(u => u[1].split('/')[1].slice(0, 8)).join(','));
  const bySlug = Object.fromEntries(sets.map(o => [JSON.parse(o[6]).slug, { id: o[7], d: JSON.parse(o[6]) }]));
  ok(['create-and-sell-an-ebook', 'where-to-start-learning-programming'].every(k => bySlug[k].d.imagePath && bySlug[k].d.imagePath.split('/')[1] === bySlug[k].id) && !bySlug['design-an-online-store'].d.imagePath, 'image path stored only on the matched lessons, under their own id');
  ok(sets.length === 9 && sets.every(o => JSON.parse(o[6]).published === false), 'draft mode saves all nine as unpublished'); }
// cover shipped inside the bundle folder
await p.setInputFiles('#import-images', []); await p.uncheck('#import-draft'); BUNDLE_SERVED.lessons[0].cover = 'covers/how-to-create-a-website-step-by-step.jpg'; await p.click('#import-reload'); await p.waitForFunction(() => document.getElementById('import-list').textContent.includes('من مجلد الحزمة'), null, { timeout: 5000 });
await p.evaluate(() => { __ops.length = 0; document.getElementById('import-msg').textContent = ''; }); await p.click('#import-run'); await waitDone();
{ const ups = (await p.evaluate(() => __ops)).filter(o => o[0] === 'upload'); ok(ups.length === 1 && ups[0][2] === 'image/jpeg', 'a cover found in the bundle folder is uploaded automatically'); }
// broken / missing bundles
BUNDLE_SERVED.lessons[2].track = 'no-such-track'; await p.click('#import-reload'); await p.waitForFunction(() => document.getElementById('import-msg').textContent.includes('غير صالح'), null, { timeout: 5000 });
ok(await p.isDisabled('#import-run'), 'an invalid bundle is rejected and the import button is disabled');
BUNDLE_STATUS = 404; await p.click('#import-reload'); await p.waitForTimeout(400); ok(!(await p.isVisible('#import-panel')), 'no bundle on the site (404) → the import panel hides itself');
ok(errs.length === 0, 'no page errors ' + errs.join('|'));
await p.screenshot({ path: OUT + '/admin.png', fullPage: false, clip: { x: 0, y: 0, width: 1200, height: 900 } });
await p.evaluate(() => document.getElementById('messages').scrollIntoView()); await p.screenshot({ path: OUT + '/admin-msgs.png' });
await p.evaluate(() => document.getElementById('cats-panel').scrollIntoView()); await p.screenshot({ path: OUT + '/admin-cats.png' });
await b.close(); server.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASSED');
