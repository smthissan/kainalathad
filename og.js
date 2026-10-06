// Vercel Function — وسوم المشاركة (OG / Twitter) لروابط المقالات والخدمات والأعمال والوسائط.
// تُستدعى فقط عبر قاعدة rewrites في vercel.json لروبوتات المعاينة. الزوار العاديون لا يمرون بها.
// عند أي فشل تُرجع الصفحة الأصلية كما هي.

const PROJECT = 'kian-al-etihad';
const KEY = 'AIzaSyBBIT4gfDSQmYltoqW1V7Th6vefiGXg-bI'; // نفس مفتاح الواجهة العام
const SITE = 'كيان للبرمجيات';
const COLLECTIONS = new Set(['articles', 'services', 'portfolio', 'media']);
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const val = (v) => {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
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
  const docP = COLLECTIONS.has(coll) && slug ? findDoc(coll, slug).catch(() => null) : Promise.resolve(null);
  const tpl = await tplP;
  const original = await tpl.text();
  const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' };
  const doc = await docP;
  if (!doc) return new Response(original, { status: 200, headers });

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

    const tags =
      `<title>${esc(title)}</title>` +
      `<meta name="description" content="${esc(desc)}">` +
      `<link rel="canonical" href="${esc(canonical)}">` +
      `<meta property="og:type" content="${coll === 'articles' ? 'article' : 'website'}">` +
      `<meta property="og:site_name" content="${esc(SITE)}">` +
      `<meta property="og:title" content="${esc(ogTitle)}">` +
      `<meta property="og:description" content="${esc(ogDesc)}">` +
      `<meta property="og:url" content="${esc(canonical)}">` +
      (img ? `<meta property="og:image" content="${esc(img)}">` : '') +
      `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">` +
      `<meta name="twitter:title" content="${esc(ogTitle)}">` +
      `<meta name="twitter:description" content="${esc(ogDesc)}">` +
      (img ? `<meta name="twitter:image" content="${esc(img)}">` : '');

    const html = original
      .replace(/<title>[\s\S]*?<\/title>/i, '')
      .replace(/<meta\s+(?:name|property)="(?:description|og:[a-z:_]+|twitter:[a-z:_]+)"[^>]*>/gi, '')
      .replace(/<link\s+rel="canonical"[^>]*>/i, '')
      .replace('</head>', tags + '</head>');
    return new Response(html, { status: 200, headers });
  } catch {
    return new Response(original, { status: 200, headers });
  }
}
