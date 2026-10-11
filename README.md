# كيان للبرمجيات — kianalathad.com

موقع عربي (RTL) من صفحة واحدة (`index.html`) يعمل على **Vercel**، ويقرأ محتواه من **Firebase** (Firestore + Storage + Auth + Cloud Functions).

## هيكل المشروع

| المسار | الوظيفة | يُنشر على |
|---|---|---|
| `index.html` | الموقع العام (توجيه داخلي، مقالات، خدمات، منتجات، نموذج تواصل، حساب العميل) | Vercel |
| `admin.html` | لوحة التحكم (`/admin.html`): المحتوى، الإعدادات، الطلبات، رسائل التواصل | Vercel |
| `api/og.js` | وسوم المشاركة (OG/Twitter) لروابط المحتوى عند معاينتها في واتساب وتويتر… | Vercel Function |
| `api/sitemap.js` | خريطة الموقع الديناميكية `/sitemap.xml` | Vercel Function |
| `vercel.json` | التوجيه وترويسات الأمان (CSP…) والتخزين المؤقت | Vercel |
| `favicon.*`, `icon-*.png`, `apple-touch-icon.png`, `manifest.webmanifest` | الأيقونات وتثبيت الموقع كتطبيق على الجوال | Vercel |
| `og-default.png` | صورة المشاركة الافتراضية (1200×630) للصفحات التي ليس لها صورة | Vercel |
| `firestore.rules` | **قواعد حماية قاعدة البيانات** | Firebase |
| `storage.rules` | **قواعد حماية الملفات** | Firebase |
| `functions/` | الدالة السحابية `getProductDownloadUrl` (روابط تنزيل مؤقتة للمنتجات المدفوعة) | Firebase |
| `tests/` | اختبارات قواعد الحماية واختبارات المتصفح | — |

ملفات Firebase والاختبارات مستبعدة من النشر على Vercel عبر `.vercelignore`، فلا يمكن فتحها من المتصفح.

## النشر

**الموقع (Vercel):** يُنشر تلقائياً عند الدمج في الفرع الرئيسي.

**قواعد Firebase والدالة السحابية** (لا تُنشر تلقائياً):

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage   # قواعد الحماية
firebase deploy --only functions                 # الدالة السحابية (بعد: cd functions && npm i)
```

> ⚠️ قبل نشر القواعد أول مرة: افتح Firebase Console ← Firestore ← Rules وانسخ القواعد الحالية احتياطياً.
> القواعد في هذا المستودع تغطي كل العمليات التي ينفذها الموقع ولوحة التحكم، ومختبرة بالكامل (انظر «الاختبارات»).

## المحتوى بتنسيق Markdown

حقل «المحتوى الكامل» في لوحة التحكم، وحقول نصوص الصفحات (من نحن، صفحات الخدمات…)، تدعم:

```
# عنوان رئيسي          ## عنوان فرعي
**نص عريض**            *نص مائل*            `كود`
- عنصر قائمة           1. عنصر مرقّم
> اقتباس
[نص الرابط](https://example.com)      [رابط داخلي](/contact)
![وصف الصورة](https://رابط-الصورة)
```

السطر الفارغ يبدأ فقرة جديدة. أي HTML يُكتب يظهر نصاً عادياً ولا يُنفَّذ (حماية من XSS)، والروابط تقبل `https://` والمسارات الداخلية فقط.

## الاختبارات

```bash
cd tests
npm install
npm run test:rules   # قواعد Firestore و Storage على محاكي Firebase (يتطلب Java)
npm run test:e2e     # اختبار الموقع في متصفح Chromium مع محاكاة Firebase
```

- **test:rules**: يتحقق أن الزائر لا يقرأ المسودات، وأن العميل لا يرى إلا طلباته ولا يتلاعب بالسعر أو الحالة، وأن رسائل التواصل لا يقرؤها إلا المدير، وأن ملفات المنتجات الخاصة لا تُقرأ من المتصفح… إلخ.
- **test:e2e**: يشغّل الموقع بترويسات `vercel.json` نفسها (بما فيها CSP) ويختبر المقالات وMarkdown والمشاركة ونموذج الطلب ونموذج التواصل واستعادة كلمة المرور وعدم وجود تمرير أفقي على الجوال.

## بعد النشر

1. **Google Search Console**: أضف النطاق `kianalathad.com` ثم أرسل `https://kianalathad.com/sitemap.xml` من قسم Sitemaps.
2. **Firebase Console ← Authentication ← Templates**: اجعل لغة رسائل البريد العربية، وخصّص اسم المرسل.
3. **(اختياري) Firebase App Check** مع reCAPTCHA لحماية نموذج التواصل من الرسائل الآلية بشكل أقوى.
