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

// أحدث المستندات المنشورة في مجموعة (الحقول اللازمة للروابط فقط)
async function listDocs(coll, n) {
  const body = {
    structuredQuery: {
      from: [{ collectionId: coll }],
      select: { fields: ['title', 'slug', 'description', 'excerpt'].map((fieldPath) => ({ fieldPath })) },
      where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } },
      limit: n,
    },
  };
  const r = await fetch(`${BASE}:runQuery?key=${KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(2500),
  });
  if (!r.ok) throw new Error(`list ${r.status}`);
  return (await r.json()).filter((x) => x.document).map((x) => ({ id: x.document.name.split('/').pop(), ...fields(x.document.fields) }));
}

// صفحات الأقسام لروبوتات البحث (الرئيسية / ملف ثابت فلا تصلها قواعد rewrites). العناوين والأوصاف مطابقة لـ routeSeo في index.html.
// sections: [المجموعة في Firestore, عنوان القسم, مسار الروابط, العدد]
const SERVICE_PAGES = [['/services/web-development', 'تطوير المواقع'], ['/services/app-development', 'تطوير التطبيقات'], ['/services/software-development', 'البرمجيات والحلول الرقمية'], ['/services/design', 'التصميم']];
const PRODUCT_PAGES = [['/products/apps', 'التطبيقات'], ['/products/templates', 'القوالب'], ['/products/scripts', 'السكريبتات'], ['/products/ebooks', 'الكتب الإلكترونية'], ['/products/design-resources', 'موارد التصميم']];
const LISTS = {
  articles: { path: '/articles', title: 'المقالات', desc: 'مقالات ودروس عملية بالعربية في إنشاء المواقع والمتاجر والتطبيقات والتصميم والبرمجة من فريق كيان للبرمجيات.', sections: [['articles', '', '/articles', 60]] },
  services: { path: '/services', title: 'الخدمات', desc: 'خدمات كيان للبرمجيات: تطوير المواقع والتطبيقات والبرمجيات المخصصة وخدمات التصميم للأفراد والشركات.', links: SERVICE_PAGES, sections: [['services', '', '/services', 60]] },
  media: { path: '/media', title: 'الوسائط', desc: 'معرض صور ومحتوى مرئي من أعمال وأنشطة كيان للبرمجيات في تطوير المواقع والتطبيقات والتصميم.', sections: [['media', '', '/media', 60]] },
  portfolio: { path: '/portfolio', title: 'أعمالنا', desc: 'نماذج من مشاريع كيان للبرمجيات: مواقع ومتاجر وتطبيقات نفّذناها لعملائنا، مع تفاصيل كل مشروع.', sections: [['portfolio', '', '/portfolio', 60]] },
  products: { path: '/products', title: 'المنتجات الرقمية', desc: 'منتجات رقمية جاهزة: كتب إلكترونية وقوالب وسكريبتات وتطبيقات وموارد تصميم، مرتبة حسب النوع.', links: PRODUCT_PAGES, sections: [['storeProducts', '', '/products', 100]] },
};

const linkList = (items) => `<ul>${items.map(([href, t]) => `<li><a href="${esc(href)}">${esc(t)}</a></li>`).join('')}</ul>`;

async function listPage(name, origin, original, html) {
  const L = LISTS[name];
  let groups;
  try {
    groups = await Promise.all(L.sections.map(([coll, , , n]) => listDocs(coll, n)));
  } catch {
    return html(original, 'no-store');
  }
  const desc = L.desc || '';
  let body = `<h1>${esc(L.title)}</h1>` + (desc ? `<p class="lead">${esc(desc)}</p>` : '') + (L.links ? `<nav>${linkList(L.links)}</nav>` : '');
  L.sections.forEach(([, heading, base], i) => {
    const docs = groups[i].filter((d) => d.title);
    if (!docs.length) return;
    body +=
      (heading ? `<h2><a href="${base}">${esc(heading)}</a></h2>` : '') +
      `<div class="grid">${docs.map((d) => `<article class="card"><h3><a href="${base}/${encodeURIComponent(d.slug || d.id)}">${esc(d.title)}</a></h3>${d.description || d.excerpt ? `<p>${esc(String(d.description || d.excerpt).slice(0, 300))}</p>` : ''}</article>`).join('')}</div>`;
  });
  const prerender = `<main id="app"><section class="detail"><div class="wrap">${body}</div></section></main>`;
  const title = `${L.title} | ${SITE}`;
  const canonical = origin + L.path;
  const img = `${origin}/og-default.png`;
  const tags =
    `<title>${esc(title)}</title>` +
    `<meta name="description" content="${esc(desc)}">` +
    `<link rel="canonical" href="${esc(canonical)}">` +
    `<meta property="og:type" content="website">` +
    `<meta property="og:site_name" content="${esc(SITE)}">` +
    `<meta property="og:locale" content="ar_AR">` +
    `<meta property="og:title" content="${esc(title)}">` +
    `<meta property="og:description" content="${esc(desc)}">` +
    `<meta property="og:url" content="${esc(canonical)}">` +
    `<meta property="og:image" content="${esc(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<meta name="twitter:title" content="${esc(title)}">` +
    `<meta name="twitter:description" content="${esc(desc)}">` +
    `<meta name="twitter:image" content="${esc(img)}">`;
  const page = original
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+(?:name|property)="(?:description|og:[a-z:_]+|twitter:[a-z:_]+)"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/i, '')
    .replace('</head>', tags + '</head>')
    .replace(/<main id="app">[\s\S]*?<\/main>/, () => prerender);
  return html(page, 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
}

export async function GET(request) {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || url.host;
  const origin = `https://${host}`;
  const list = url.searchParams.get('list') || '';
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
  const html = (body, cache, status = 200) =>
    new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cache } });

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
  if (Object.hasOwn(LISTS, list)) return listPage(list, origin, original, html);
  const doc = await docP;
  if (doc === undefined) return html(original, 'no-store');
  // slug غير موجود أو غير منشور: 404 حقيقي للروبوتات كي لا تُعدّ الصفحة soft-404 (الواجهة تضع noindex للزوار)
  if (!doc) return html(original, CACHE_MISS, 404);

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
      `<meta property="og:locale" content="ar_AR">` +
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
