// خادم محلي يحاكي Vercel (ترويسات vercel.json وضغط gzip) لقياس الأداء بـ Lighthouse.
// الاستخدام: node tests/perf/serve.mjs  ثم  npx lighthouse http://localhost:4300/ --only-categories=performance,accessibility,best-practices,seo
// الصفحات تقرأ المحتوى الحقيقي من Firestore، فالأرقام تعكس الصور المرفوعة فعلاً.
import http from 'http'; import fs from 'fs'; import path from 'path'; import zlib from 'zlib';
const ROOT=new URL('../../',import.meta.url).pathname.replace(/\/$/,'');const vj=JSON.parse(fs.readFileSync(ROOT+'/vercel.json','utf8'));
const rules=vj.headers.map(h=>({re:new RegExp('^'+h.source.replace(/\(\.\*\)/g,'.*').replace(/\(\.\+\)/g,'.+')+'$'),h:h.headers}));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.md':'text/markdown; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
http.createServer((q,r)=>{const u=new URL(q.url,'http://x');let f=path.join(ROOT,decodeURIComponent(u.pathname));if(!(fs.existsSync(f)&&fs.statSync(f).isFile()))f=ROOT+'/index.html';
for(const x of rules)if(x.re.test(u.pathname))for(const h of x.h)r.setHeader(h.key,h.value);
const ext=path.extname(f);r.setHeader('content-type',types[ext]||'application/octet-stream');let b=fs.readFileSync(f);
if(/html|javascript|css|svg|markdown/.test(types[ext]||'')&&/gzip/.test(q.headers['accept-encoding']||'')){b=zlib.brotliCompressSync?zlib.gzipSync(b):b;r.setHeader('content-encoding','gzip')}
r.end(b)}).listen(4300);
