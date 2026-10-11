import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs';
const server = http.createServer((q, r) => { r.setHeader('content-type', 'text/html; charset=utf-8'); r.end(fs.readFileSync(new URL('../admin.html', import.meta.url))); }).listen(4174);
const OUT = process.argv[2] || fs.mkdtempSync('/tmp/kian-admin-');
const ts = (iso) => `({toDate:()=>new Date('${iso}')})`;
const mods = {
  'firebase-app.js': `export const initializeApp=()=>({});`,
  'firebase-storage.js': `export const getStorage=()=>({}),ref=()=>({}),uploadBytes=async()=>{},getDownloadURL=async()=>'',deleteObject=async()=>{};`,
  'firebase-auth.js': `export const getAuth=()=>({});export const signInWithEmailAndPassword=async()=>{},signOut=async()=>{};export function onAuthStateChanged(a,cb){setTimeout(()=>cb({uid:'adm',email:'smthysan@gmail.com'}),0)}`,
  'firebase-firestore.js': `globalThis.__ops=[];const MSGS=[{id:'m1',d:{name:'أحمد',email:'a@b.co',phone:'+9677',subject:'موقع',message:'أريد موقعاً\\nسطر 2',status:'new',createdAt:${ts('2026-10-10T10:00:00Z')}}},{id:'m2',d:{name:'<b>x</b>',email:'x@y.z',message:'تمت',status:'replied',createdAt:${ts('2026-10-09T10:00:00Z')}}}];
export const getFirestore=()=>({}),collection=(db,n)=>({n}),doc=(db,c,i)=>({c,i}),query=(c)=>c,limit=()=>0,orderBy=()=>0,serverTimestamp=()=>'ST';
export async function getDocs(c){const docs=c.n==='contactMessages'?MSGS.filter(m=>!globalThis.__deleted?.includes(m.id)).map(m=>({id:m.id,data:()=>m.d})):[];return {docs,empty:!docs.length,forEach:f=>docs.forEach(f)}}
export async function getDoc(){return {data:()=>({}),exists:()=>true}}
export async function updateDoc(r,d){__ops.push(['update',r.c,r.i,d.status]);const m=MSGS.find(x=>x.id===r.i);if(m)m.d.status=d.status}
export async function deleteDoc(r){__ops.push(['delete',r.c,r.i]);(globalThis.__deleted||=[]).push(r.i)}
export async function setDoc(){} export async function addDoc(c,d){__ops.push(['add',c.n,d.action])}`,
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
ok(errs.length === 0, 'no page errors ' + errs.join('|'));
await p.screenshot({ path: OUT + '/admin.png', fullPage: false, clip: { x: 0, y: 0, width: 1200, height: 900 } });
await p.evaluate(() => document.getElementById('messages').scrollIntoView()); await p.screenshot({ path: OUT + '/admin-msgs.png' });
await b.close(); server.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASSED');
