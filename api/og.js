// Vercel Function — وسوم المشاركة (OG / Twitter) لروابط المقالات والخدمات والأعمال والوسائط.
// تُستدعى فقط عبر قاعدة rewrites في vercel.json لروبوتات المعاينة. الزوار العاديون لا يمرون بها.
// عند أي فشل تُرجع الصفحة الأصلية كما هي.

import { md } from './_md.js';

const PROJECT = 'kian-al-etihad';
const KEY = 'AIzaSyBBIT4gfDSQmYltoqW1V7Th6vefiGXg-bI'; // نفس مفتاح الواجهة العام
const SITE = 'كيان للبرمجيات';
// مسار الرابط في الموقع ← اسم المجموعة في Firestore
const COLLECTIONS = { articles: 'articles', services: 'services', portfolio: 'portfolio', media: 'media', products: 'storeProducts' };
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const val = (v) => {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('mapValue' in v) return fields(v.mapValue.fields);
  return null;
};
const fields = (f) => {
  const o = {};
  for (const k in f || {}) o[k] = val(f[k]);
  return o;
};
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function findDoc(coll, slug) {
  const eq = (f, value) => ({ fieldFilter: { field: { fieldPath: f }, op: 'EQUAL', value } });
  const body = {
    structuredQuery: {
      from: [{ collectionId: coll }],
      where: { compositeFilter: { op: 'AND', filters: [eq('slug', { stringValue: slug }), eq('published', { booleanValue: true })] } },
      limit: 1,
    },
  };
  const r = await fetch(`${BASE}:runQuery?key=${KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(2500),
  });
  if (r.ok) {
    const j = await r.json();
    const d = j.find((x) => x.document)?.document;
    if (d) return fields(d.fields);
  }
  const r2 = await fetch(`${BASE}/${coll}/${encodeURIComponent(slug)}?key=${KEY}`, { signal: AbortSignal.timeout(2500) });
  if (r2.ok) {
    const f = fields((await r2.json()).fields);
    if (f.published === true) return f;
  }
  return null;
}

export async function GET(request) {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || url.host;
  const origin = `https://${host}`;
  const coll = url.searchParams.get('c') || '';
  let slug = url.searchParams.get('slug') || '';
  if (slug.includes('%')) { try { slug = decodeURIComponent(slug); } catch {} }

  // القالب الأصلي (index.html) — يُجلب من الملفات الثابتة للنشر نفسه
  const tplP = fetch(`${origin}/index.html`, { signal: AbortSignal.timeout(4000) });
  // undefined = فشل الاتصال بـ Firestore، null = المستند غير موجود أو غير منشور
  const docP = Object.hasOwn(COLLECTIONS, coll) && slug ? findDoc(COLLECTIONS[coll], slug).catch(() => undefined) : Promise.resolve(null);

  // التخزين المؤقت في شبكة Vercel: النتيجة الناجحة 10 دقائق، و"غير موجود" دقيقة، والفشل لا يُخزَّن
  const CACHE_OK = 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400';
  const CACHE_MISS = 'public, max-age=0, s-maxage=60';
  const html = (body, cache) =>
    new Response(body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cache } });

  let original;
  try {
    const tpl = await tplP;
    if (!tpl.ok) throw new Error(`template ${tpl.status}`);
    original = await tpl.text();
  } catch {
    // بدون القالب لا توجد صفحة نعرضها؛ 503 تُفهم عند محركات البحث كخلل مؤقت
    return new Response('Service temporarily unavailable', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '120' },
    });
  }
  const doc = await docP;
  if (doc === undefined) return html(original, 'no-store');
  if (!doc) return html(original, CACHE_MISS);

  try {
    const seo = doc.seo && typeof doc.seo === 'object' ? doc.seo : {};
    const pageTitle = seo.title || doc.title || '';
    const title = pageTitle ? `${pageTitle} | ${SITE}` : SITE;
    const desc = String(seo.description || doc.description || doc.excerpt || '').slice(0, 200);
    const ogTitle = seo.ogTitle || pageTitle || SITE;
    const ogDesc = String(seo.ogDescription || desc).slice(0, 200);
    const canonical = /^https:\/\//.test(seo.canonical || '') ? seo.canonical : `${origin}/${coll}/${encodeURIComponent(slug)}`;
    let img = String(doc.imageUrl || '').trim();
    if (img.startsWith('/')) img = origin + img;
    if (!/^https:\/\//.test(img)) img = '';
    // بدون صورة خاصة: صورة المشاركة الافتراضية للموقع
    const ownImg = !!img;
    if (!img) img = `${origin}/og-default.png`;

    const tags =
      `<title>${esc(title)}</title>` +
      `<meta name="description" content="${esc(desc)}">` +
      `<link rel="canonical" href="${esc(canonical)}">` +
      `<meta property="og:type" content="${coll === 'articles' ? 'article' : coll === 'products' ? 'product' : 'website'}">` +
      `<meta property="og:site_name" content="${esc(SITE)}">` +
      `<meta property="og:title" content="${esc(ogTitle)}">` +
      `<meta property="og:description" content="${esc(ogDesc)}">` +
      `<meta property="og:url" content="${esc(canonical)}">` +
      `<meta property="og:image" content="${esc(img)}">` +
      (ownImg ? '' : '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">') +
      `<meta property="og:image:alt" content="${esc(ogTitle)}">` +
      `<meta name="twitter:card" content="summary_large_image">` +
      `<meta name="twitter:title" content="${esc(ogTitle)}">` +
      `<meta name="twitter:description" content="${esc(ogDesc)}">` +
      `<meta name="twitter:image" content="${esc(img)}">`;

    // محتوى الصفحة كاملاً داخل <main> لروبوتات البحث والمعاينة. المتصفح يستبدله فور تشغيل الجافاسكربت.
    const bodyText = String(doc.content || doc.description || '');
    const prerender =
      `<main id="app"><section class="detail"><div class="wrap"><h1>${esc(pageTitle)}</h1>` +
      (desc ? `<p class="lead">${esc(desc)}</p>` : '') +
      (ownImg ? `<img src="${esc(img)}" alt="${esc(pageTitle)}" width="1200" height="630">` : '') +
      `<div class="content-body md">${md(bodyText)}</div></div></section></main>`;

    const page = original
      .replace(/<title>[\s\S]*?<\/title>/i, '')
      .replace(/<meta\s+(?:name|property)="(?:description|og:[a-z:_]+|twitter:[a-z:_]+)"[^>]*>/gi, '')
      .replace(/<link\s+rel="canonical"[^>]*>/i, '')
      .replace('</head>', tags + '</head>')
      .replace(/<main id="app">[\s\S]*?<\/main>/, () => prerender);
    return html(page, CACHE_OK);
  } catch {
    return html(original, 'no-store');
  }
}
