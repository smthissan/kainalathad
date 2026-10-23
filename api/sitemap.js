// Vercel Function — خريطة موقع ديناميكية تُخدم على /sitemap.xml (عبر rewrites في vercel.json).
// تجمع الصفحات الثابتة + كل المحتوى المنشور في Firestore، وتاريخ آخر تعديل من المستند نفسه.
// عند فشل Firestore تُرجع الصفحات الثابتة على الأقل مع تخزين مؤقت قصير.

const PROJECT = 'kian-al-etihad';
const KEY = 'AIzaSyBBIT4gfDSQmYltoqW1V7Th6vefiGXg-bI'; // نفس مفتاح الواجهة العام
const ORIGIN = 'https://kianalathad.com';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const MAX_PER_COLLECTION = 1000;

// [المسار, changefreq, priority]
const STATIC_PAGES = [
  ['/', 'weekly', '1.0'],
  ['/services', 'weekly', '0.9'],
  ['/products', 'weekly', '0.9'],
  ['/learn', 'weekly', '0.9'],
  ['/articles', 'weekly', '0.8'],
  ['/media', 'weekly', '0.8'],
  ['/portfolio', 'weekly', '0.9'],
  ['/about', 'monthly', '0.7'],
  ['/contact', 'monthly', '0.8'],
  ['/tools', 'monthly', '0.7'],
  ['/tools/qr-code', 'monthly', '0.7'],
  ['/tools/invoice', 'monthly', '0.7'],
  ['/privacy', 'yearly', '0.3'],
  ['/terms', 'yearly', '0.3'],
  ['/refund', 'yearly', '0.3'],
  ['/services/web-development', 'monthly', '0.8'],
  ['/services/app-development', 'monthly', '0.8'],
  ['/services/software-development', 'monthly', '0.8'],
  ['/services/design', 'monthly', '0.8'],
];

// صفحات أقسام المنتجات: تُضاف فقط إذا كان في القسم منتج منشور (الصفحة الفارغة تضر بالسيو)
const CATEGORY_PAGES = ['ebooks', 'scripts', 'design-resources', 'apps', 'templates'];

// مسارات الأكاديمية (حقل track في المقالات): يُضاف المسار فقط إذا كان فيه درس منشور
const LEARN_TRACKS = ['websites', 'stores', 'apps', 'ai', 'digital-products', 'programming'];

// [المجموعة في Firestore, بادئة الرابط في الموقع, changefreq, priority]
const COLLECTIONS = [
  ['articles', '/articles', 'monthly', '0.7'],
  ['services', '/services', 'monthly', '0.7'],
  ['portfolio', '/portfolio', 'monthly', '0.6'],
  ['media', '/media', 'monthly', '0.5'],
  ['storeProducts', '/products', 'weekly', '0.7'],
];

const xmlEsc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

// المنشور فقط، مع جلب حقل slug وحده لتقليل حجم الرد
async function listPublished(coll) {
  const body = {
    structuredQuery: {
      from: [{ collectionId: coll }],
      where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } },
      select: { fields: [{ fieldPath: 'slug' }, { fieldPath: 'category' }, { fieldPath: 'track' }] },
      limit: MAX_PER_COLLECTION,
    },
  };
  const r = await fetch(`${BASE}:runQuery?key=${KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(4000),
  });
  if (!r.ok) throw new Error(`${coll} ${r.status}`);
  const rows = await r.json();
  return rows
    .filter((x) => x.document)
    .map((x) => ({
      // نفس منطق الواجهة: slug إن وُجد وإلا معرّف المستند
      slug: String(x.document.fields?.slug?.stringValue || '').trim() || x.document.name.split('/').pop(),
      updated: x.document.updateTime,
      category: String(x.document.fields?.category?.stringValue || '').trim(),
      track: String(x.document.fields?.track?.stringValue || '').trim(),
    }));
}

const lastmod = (t) => {
  const d = new Date(t || '');
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : '';
};

const urlTag = (path, freq, prio, mod) =>
  `<url><loc>${xmlEsc(ORIGIN + path)}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}` +
  `<changefreq>${freq}</changefreq><priority>${prio}</priority></url>`;

export async function GET() {
  const results = await Promise.allSettled(COLLECTIONS.map(([coll]) => listPublished(coll)));

  // الصفحات الثابتة لها الأولوية في الواجهة (مثل /services/design و/products/apps)، فلا تُكرَّر
  const seen = new Set([...STATIC_PAGES.map(([p]) => p), ...CATEGORY_PAGES.map((c) => `/products/${c}`), ...LEARN_TRACKS.map((t) => `/learn/${t}`)]);
  const urls = STATIC_PAGES.map(([p, f, pr]) => urlTag(p, f, pr, ''));
  // إذا فشل جلب المنتجات تُضاف كل الأقسام احتياطاً
  const products = results[COLLECTIONS.findIndex(([c]) => c === 'storeProducts')];
  const usedCats = products.status === 'fulfilled' ? new Set(products.value.map((p) => p.category)) : new Set(CATEGORY_PAGES);
  for (const c of CATEGORY_PAGES) if (usedCats.has(c)) urls.push(urlTag(`/products/${c}`, 'weekly', '0.7', ''));
  // إذا فشل جلب المقالات لا تُضاف صفحات المسارات (الصفحة الفارغة لا تُفهرَس)
  const articles = results[COLLECTIONS.findIndex(([c]) => c === 'articles')];
  const usedTracks = articles.status === 'fulfilled' ? new Set(articles.value.map((a) => a.track)) : new Set();
  for (const t of LEARN_TRACKS) if (usedTracks.has(t)) urls.push(urlTag(`/learn/${t}`, 'weekly', '0.8', ''));
  let failed = false;

  results.forEach((res, i) => {
    if (res.status !== 'fulfilled') {
      failed = true;
      return;
    }
    const [, prefix, freq, prio] = COLLECTIONS[i];
    for (const { slug, updated } of res.value) {
      const path = `${prefix}/${encodeURIComponent(slug)}`;
      if (seen.has(path)) continue;
      seen.add(path);
      urls.push(urlTag(path, freq, prio, lastmod(updated)));
    }
  });

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') +
    '\n</urlset>\n';

  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // ساعة في شبكة Vercel، ودقيقة فقط إذا فشلت إحدى المجموعات
      'cache-control': failed
        ? 'public, max-age=0, s-maxage=60'
        : 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
