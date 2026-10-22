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
const LISTS={storeProducts:[{id:'p1',d:{title:'قالب متجر',slug:'store-template',published:true}},{id:'p2',d:{title:'منتج مسودة',slug:'draft-prod',published:false}}],services:[{id:'s1',d:{title:'تطوير تطبيقات',slug:'apps-svc',published:true}}],articles:[{id:'a1',d:{title:'درس قديم',slug:'old-lesson',published:true,track:'websites',relatedProduct:'gone-prod',relatedService:'web-development'}}]};
export async function getDocs(c){const docs=c.n==='contactMessages'?MSGS.filter(m=>!globalThis.__deleted?.includes(m.id)).map(m=>({id:m.id,data:()=>m.d})):(LISTS[c.n]||[]).map(m=>({id:m.id,data:()=>m.d}));return {docs,empty:!docs.length,forEach:f=>docs.forEach(f)}}
export async function getDoc(){return {data:()=>({}),exists:()=>true}}
export async function updateDoc(r,d){__ops.push(['update',r.c,r.i,d.status]);const m=MSGS.find(x=>x.id===r.i);if(m)m.d.status=d.status}
export async function deleteDoc(r){__ops.push(['delete',r.c,r.i]);(globalThis.__deleted||=[]).push(r.i)}
export async function setDoc(r,d){__ops.push(['set',r.c,d.fileContentType,d.privateFilePath,d.productCategories?JSON.stringify(d.productCategories):undefined,d.track!==undefined?JSON.stringify({track:d.track,relatedProduct:d.relatedProduct,relatedService:d.relatedService}):undefined])} export async function addDoc(c,d){__ops.push(['add',c.n,d.action])}`,
};
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } }); const errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
await p.route('https://www.gstatic.com/**', r => r.fulfill({ contentType: 'text/javascript', body: mods[r.request().url().split('/').pop()] }));
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
ok(errs.length === 0, 'no page errors ' + errs.join('|'));
await p.screenshot({ path: OUT + '/admin.png', fullPage: false, clip: { x: 0, y: 0, width: 1200, height: 900 } });
await p.evaluate(() => document.getElementById('messages').scrollIntoView()); await p.screenshot({ path: OUT + '/admin-msgs.png' });
await p.evaluate(() => document.getElementById('cats-panel').scrollIntoView()); await p.screenshot({ path: OUT + '/admin-cats.png' });
await b.close(); server.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASSED');
