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
  ['/articles', 'weekly', '0.8'],
  ['/media', 'weekly', '0.8'],
  ['/portfolio', 'weekly', '0.9'],
  ['/about', 'monthly', '0.7'],
  ['/contact', 'monthly', '0.8'],
  ['/services/web-development', 'monthly', '0.8'],
  ['/services/app-development', 'monthly', '0.8'],
  ['/services/software-development', 'monthly', '0.8'],
  ['/services/design', 'monthly', '0.8'],
  ['/products/apps', 'weekly', '0.8'],
  ['/products/templates', 'weekly', '0.8'],
  ['/products/scripts', 'weekly', '0.8'],
  ['/products/ebooks', 'weekly', '0.7'],
  ['/products/design-resources', 'weekly', '0.7'],
];

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
      select: { fields: [{ fieldPath: 'slug' }] },
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
  const seen = new Set(STATIC_PAGES.map(([p]) => p));
  const urls = STATIC_PAGES.map(([p, f, pr]) => urlTag(p, f, pr, ''));
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
