# برومبتات صور الدروس: مواصفات دقيقة وجاهزة للتنفيذ

لكل درس صورة واحدة تخدم **ثلاثة أماكن** في آن واحد: بطاقة الدرس في الأكاديمية، ورأس صفحة الدرس، ومعاينة الرابط عند مشاركته في واتساب وإكس وفيسبوك ولينكدإن. لذلك صُمّمت المواصفات على الطريقة التي يعرض بها موقعك الصور فعلاً، لا على مقاس عام.

## 1) المقاس والمنطقة الآمنة

| البند | القيمة |
|---|---|
| **المقاس النهائي** | **1200 × 630 بكسل** (نسبة 1.91:1) |
| صيغة الملف | JPEG بجودة 82 إلى 88 أو WebP. اجعل الحجم **أقل من 250 كيلوبايت** لسرعة الصفحة (حد الرفع في موقعك 10 ميغابايت) |
| اسم الملف | `slug-الدرس.jpg` (مثال: `create-and-sell-an-ebook.jpg`) |
| **المنطقة الآمنة للنص** | من x = 110 إلى x = 1090، ومن y = 50 إلى y = 580. **لا تضع أي نص خارجها** |

**لماذا هذه المنطقة؟** بطاقات الأكاديمية تعرض الصورة بنسبة 16:10 وتقصّ الأطراف، فيضيع نحو 96 بكسلاً من كل جانب. ومعاينات المشاركة قد تقصّ هي أيضاً قليلاً. وبقاء النص داخل الإطار الآمن يضمن ظهوره كاملاً في كل الأماكن.

## 2) هوية الألوان والخط (من موقعك نفسه)

| العنصر | القيمة |
|---|---|
| تدرّج الخلفية | `#3b0764` ← `#5b21b6` ← `#7c3aed` بزاوية قطرية |
| الذهبي (للتمييز والشارة) | `#c9a227` |
| الحبر الداكن (نص فوق الذهبي) | `#1e1b4b` |
| الأبيض | `#ffffff` (العناوين) |
| اللافندر الفاتح (النص الفرعي) | `#ddd6fe` |
| الخط | **IBM Plex Sans Arabic** وهو خط موقعك نفسه، ومجاني بترخيص SIL OFL (حمّله من Google Fonts واستخدمه في Figma أو Photopea أو أي برنامج يقبل الخطوط المثبّتة). موقعك يستضيف منه **وزنين فقط: عادي 400 وعريض 700**، فاستخدم هذين الوزنين وحدهما ليتطابق الشكل |

## 3) الطريقة الموصى بها: خطوتان

> **لا تطلب من مولّد الصور أن يكتب النص العربي.** النماذج ما زالت تخطئ كثيراً في وصل الحروف العربية واتجاهها، وقد تقلب الكلمات أو تبدّل الحروف، وتصعب ملاحظة الخطأ. الطريقة المضمونة: **ارسم الخلفية والمشهد بدون نص، ثم أضف النص بنفسك فوقها.**

**الخطوة أ: ولّد الخلفية.**
1. ألصق **البرومبت الأساسي** (القسم 4) ثم **مشهد** الدرس (القسم 6) ثم **قائمة الممنوعات**.
2. اختر نسبة 16:9. إن استخدمت Midjourney أضف `--ar 16:9`، وفي غيره اختر أقرب مقاس 16:9 تتيحه أداتك (مثل 1792×1024 أو 1920×1080).
3. ولّد 3 إلى 4 نسخ واختر الأفضل. المشهد في **النصف الأيسر** والنصف الأيمن هادئ.

**الخطوة ب: القصّ والتحجيم.**
- من **1920×1080**: اقصّ من الأعلى والأسفل 36 بكسلاً لكل جانب فيصير **1920×1008**، ثم صغّره إلى **1200×630**.
- من **1792×1024**: اقصّ 84 بكسلاً من كل جانب فيصير **1792×940**، ثم صغّره إلى **1200×630**.

**الخطوة ج: أضف طبقات النص** حسب القسم 5.

> إن أصررت على كتابة النص داخل المولّد: أضف إلى البرومبت سطراً مثل `Overlay these exact Arabic texts, right-aligned, right-to-left: "…"` وانسخ النص من بطاقة الدرس، ثم **دقّق كل حرف** على الصورة الناتجة. إن وجدت أي خطأ فارجع للطريقة الموصى بها.

## 4) البرومبت الأساسي (يُلصق في بداية كل برومبت)

```
Flat isometric vector illustration, modern tech editorial style, 16:9 landscape. Background: smooth diagonal gradient from deep violet #3b0764 through purple #5b21b6 to bright violet #7c3aed, with a very subtle dot-grid texture and a soft glow behind the main subject. Palette: white and soft lavender (#f7f6fc, #ddd6fe) for surfaces, gold #c9a227 for highlights and call-to-action elements, dark navy #1e1b4b for fine details. Clean crisp edges, soft long shadows, gentle depth, consistent line weight. COMPOSITION: group every subject in the LEFT 55% of the frame, vertically centered, with generous margins from the edges; keep the RIGHT 45% as calm empty gradient with no objects, reserved for a text overlay.
```

**قائمة الممنوعات (تُلصق في آخر كل برومبت، أو في خانة Negative prompt إن وُجدت):**

```
Strictly no text of any kind, no letters, no Arabic script, no numbers, no watermark, no logos or brand marks, no trademarks, no human faces, no hands, no photorealism, no clutter, no thick black outlines.
```

الصيغة النهائية لكل صورة = **البرومبت الأساسي + مشهد الدرس + قائمة الممنوعات**.

## 5) طبقات النص (على لوحة 1200×630)

الاتجاه من اليمين لليسار والمحاذاة لليمين، لأن العين العربية تبدأ من اليمين. جميع الإحداثيات تقريبية ويمكنك تعديلها بما لا يخرج عن المنطقة الآمنة.

| الطبقة | الخط والحجم | اللون | الموضع والحدود |
|---|---|---|---|
| **الشارة** (اسم المسار) | **Bold**، 26 بكسل | نص `#1e1b4b` على كبسولة `#c9a227` بنصف قطر 24 | حافتها اليمنى عند x = 1090، وأعلاها y = 64، ارتفاعها 48، وعرضها بحسب النص مع هامش 22 بكسل من الجانبين |
| **العنوان الرئيسي** | **Bold، 72 بكسل**، ارتفاع السطر 94 | `#ffffff` | مربع نص من x = 530 إلى 1090 (عرض 560)، يبدأ عند y = 140، **ثلاثة أسطر كحد أقصى** |
| **العنوان الفرعي** | **Regular**، 32 بكسل، ارتفاع السطر 44 | `#ddd6fe` | في المربع نفسه، بعد آخر سطر من العنوان بـ 24 بكسل، **سطران كحد أقصى** |
| **توقيع العلامة** | شعار 44×44 (استخدم `icon-512.png` أو `favicon.svg` من موقعك) ثم «كيان للبرمجيات» **Bold** 26 بكسل | أبيض | أسفل اليمين: حافة الشعار اليمنى عند x = 1090، وأسفله عند y = 586 |
| **عنوان الموقع** | Regular، 22 بكسل (لاتيني) | أبيض بشفافية 70% | أسفل اليسار عند x = 110، y = 560 |

**ما اختبرتُه فعلاً:** رسمتُ العناوين التسعة بخط موقعك الحقيقي وبهذه المقاسات تماماً (عنوان 72 بكسل داخل مربع عرضه 560)، فجاء كل عنوان في **سطر واحد أو سطرين** والعنوان الفرعي في سطر واحد، وبقيت كل الطبقات داخل المنطقة الآمنة. صورة المخطط في الملف `layout-guide.png`.

**قواعد القراءة على الجوال:** بطاقة الدرس تعرض الصورة بعرض نحو 290 بكسلاً فقط، أي ربع حجمها تقريباً. لذلك لا تنزل بالعنوان الرئيسي عن **72 بكسل**، ولا تتجاوز **ثلاثة أسطر**.

**كلمة Flutter (الدرس 9):** اكتب العنوان كما هو «تطبيقات Flutter» وتأكد بعد الكتابة أن الكلمة اللاتينية جاءت في مكانها الصحيح من الجملة وليست في أولها، فبعض برامج التصميم تبدّل ترتيب الكلمات المختلطة.

## 6) الدروس التسعة


### الدرس 1: كيف تنشئ موقعاً إلكترونياً من الصفر: دليل عملي خطوة بخطوة

**ملف الصورة:** `how-to-create-a-website-step-by-step.jpg`  ·  **المقاس:** 1200×630

**النصوص التي تُكتب على الصورة (حرفياً، بدون تغيير). العلامة `/` في صف التقسيم تعني نزول سطر جديد ولا تُكتب على الصورة:**

| الطبقة | النص |
|---|---|
| الشارة | إنشاء المواقع |
| العنوان الرئيسي | أنشئ موقعك من الصفر |
| تقسيم أسطر العنوان (للتوازن) | أنشئ موقعك / من الصفر |
| العنوان الفرعي | دليل عملي بسبع خطوات |
| توقيع العلامة | كيان للبرمجيات |
| عنوان الموقع | kianalathad.com |

**مشهد الصورة (يُلصق بعد البرومبت الأساسي):**

```
A laptop and a smartphone floating side by side, both showing a clean website wireframe made only of gray placeholder bars (a hero block, three small cards, a footer — no readable content). Below them a dotted path winds from the bottom-left corner up toward the devices, linking seven small empty glowing circles (waypoints, no numbers inside); the last waypoint is a small gold flag. Light sparkles around the laptop.
```

**النص البديل (Alt) للصورة:** تخطيط صفحة رئيسية لموقع إلكتروني على اللابتوب والجوال


### الدرس 2: إنشاء موقع إلكتروني مجاني: الخيارات الحقيقية وحدودها

**ملف الصورة:** `free-website-options.jpg`  ·  **المقاس:** 1200×630

**النصوص التي تُكتب على الصورة (حرفياً، بدون تغيير). العلامة `/` في صف التقسيم تعني نزول سطر جديد ولا تُكتب على الصورة:**

| الطبقة | النص |
|---|---|
| الشارة | إنشاء المواقع |
| العنوان الرئيسي | موقع مجاني: الخيارات الحقيقية |
| تقسيم أسطر العنوان (للتوازن) | موقع مجاني: / الخيارات الحقيقية |
| العنوان الفرعي | ثلاثة خيارات وحدود كل خيار |
| توقيع العلامة | كيان للبرمجيات |
| عنوان الموقع | kianalathad.com |

**مشهد الصورة (يُلصق بعد البرومبت الأساسي):**

```
One glowing starting orb on the far left from which three paths fan out to the right, each ending on a different simple object on a rounded tile: (1) a browser window with draggable blocks, (2) a stack of building blocks with a small gear, (3) a document page with abstract angle-bracket shapes made of two chevrons (no letters). A blank gold gift-tag shape with a ribbon floats near the starting orb (the tag stays empty, no text).
```

**النص البديل (Alt) للصورة:** ثلاثة مسارات لإنشاء موقع إلكتروني مجاني


### الدرس 3: إنشاء موقع بالذكاء الاصطناعي: ما يستطيعه حقاً وما لا يستطيعه

**ملف الصورة:** `create-website-with-ai.jpg`  ·  **المقاس:** 1200×630

**النصوص التي تُكتب على الصورة (حرفياً، بدون تغيير). العلامة `/` في صف التقسيم تعني نزول سطر جديد ولا تُكتب على الصورة:**

| الطبقة | النص |
|---|---|
| الشارة | الذكاء الاصطناعي |
| العنوان الرئيسي | موقع بالذكاء الاصطناعي |
| تقسيم أسطر العنوان (للتوازن) | موقع بالذكاء / الاصطناعي |
| العنوان الفرعي | ما يستطيعه وما لا يستطيعه |
| توقيع العلامة | كيان للبرمجيات |
| عنوان الموقع | kianalathad.com |

**مشهد الصورة (يُلصق بعد البرومبت الأساسي):**

```
A laptop whose screen shows a website layout being assembled from floating UI blocks and sparkle particles. Beside it a large magnifying glass with a gold check mark in its lens, and a clipboard with a column of tick marks drawn as small gold checks next to gray bars (no text) symbolising human review. Faint circuit-line pattern in the background, very low contrast.
```

**النص البديل (Alt) للصورة:** مسودة موقع مولّدة بالذكاء الاصطناعي مع قائمة مراجعة


### الدرس 4: كيف تصمم متجراً إلكترونياً ناجحاً: من الفكرة إلى أول طلب

**ملف الصورة:** `design-an-online-store.jpg`  ·  **المقاس:** 1200×630

**النصوص التي تُكتب على الصورة (حرفياً، بدون تغيير). العلامة `/` في صف التقسيم تعني نزول سطر جديد ولا تُكتب على الصورة:**

| الطبقة | النص |
|---|---|
| الشارة | المتاجر الإلكترونية |
| العنوان الرئيسي | صمّم متجراً يبيع فعلاً |
| تقسيم أسطر العنوان (للتوازن) | صمّم متجراً / يبيع فعلاً |
| العنوان الفرعي | من الفكرة إلى أول طلب |
| توقيع العلامة | كيان للبرمجيات |
| عنوان الموقع | kianalathad.com |

**مشهد الصورة (يُلصق بعد البرومبت الأساسي):**

```
A large smartphone in the center-left showing a product page wireframe: a product image placeholder, a price bar, and a prominent gold add-to-cart button. Orbiting it: a shopping cart icon, a delivery box with a small shield-with-check badge, and a plain bank-card shape with no numbers. Soft gold sparkles.
```

**النص البديل (Alt) للصورة:** تصميم صفحة منتج وسلة شراء في متجر إلكتروني


### الدرس 5: ووردبريس للمبتدئين: من التثبيت إلى أول صفحة منشورة

**ملف الصورة:** `wordpress-for-beginners.jpg`  ·  **المقاس:** 1200×630

**النصوص التي تُكتب على الصورة (حرفياً، بدون تغيير). العلامة `/` في صف التقسيم تعني نزول سطر جديد ولا تُكتب على الصورة:**

| الطبقة | النص |
|---|---|
| الشارة | إنشاء المواقع |
| العنوان الرئيسي | ووردبريس للمبتدئين |
| تقسيم أسطر العنوان (للتوازن) | ووردبريس / للمبتدئين |
| العنوان الفرعي | من التثبيت إلى أول صفحة |
| توقيع العلامة | كيان للبرمجيات |
| عنوان الموقع | kianalathad.com |

**مشهد الصورة (يُلصق بعد البرومبت الأساسي):**

```
A browser window showing a generic website dashboard wireframe: a vertical sidebar menu made of icon blocks and a content editor area made of block placeholders. Floating around it: a puzzle-piece (plugin) tile, a theme color-swatch card, a padlock with a shield (security), and a circular backup arrow. Do NOT draw any CMS or WordPress logo or any letter W.
```

**النص البديل (Alt) للصورة:** لوحة تحكم ووردبريس للمبتدئين


### الدرس 6: المنتجات الرقمية: ما هي وكيف تبدأ في بيعها خطوة بخطوة

**ملف الصورة:** `how-to-start-selling-digital-products.jpg`  ·  **المقاس:** 1200×630

**النصوص التي تُكتب على الصورة (حرفياً، بدون تغيير). العلامة `/` في صف التقسيم تعني نزول سطر جديد ولا تُكتب على الصورة:**

| الطبقة | النص |
|---|---|
| الشارة | بيع المنتجات الرقمية |
| العنوان الرئيسي | ابدأ بيع منتجاتك الرقمية |
| تقسيم أسطر العنوان (للتوازن) | ابدأ بيع / منتجاتك الرقمية |
| العنوان الفرعي | خطة عملية لثلاثين يوماً |
| توقيع العلامة | كيان للبرمجيات |
| عنوان الموقع | kianalathad.com |

**مشهد الصورة (يُلصق بعد البرومبت الأساسي):**

```
A glowing cloud with a download arrow in the center-left; around it floating on small rounded tiles are digital products: an e-book, a page-layout template, an app window, a grid of design icons, and a spreadsheet. A few gold sparkles; no coins, no dollar signs, no currency symbols.
```

**النص البديل (Alt) للصورة:** أنواع المنتجات الرقمية: كتب وقوالب وبرامج وملفات


### الدرس 7: كيف تؤلف كتاباً إلكترونياً وتبيعه: من الفكرة إلى أول عملية بيع

**ملف الصورة:** `create-and-sell-an-ebook.jpg`  ·  **المقاس:** 1200×630

**النصوص التي تُكتب على الصورة (حرفياً، بدون تغيير). العلامة `/` في صف التقسيم تعني نزول سطر جديد ولا تُكتب على الصورة:**

| الطبقة | النص |
|---|---|
| الشارة | بيع المنتجات الرقمية |
| العنوان الرئيسي | ألّف كتابك الإلكتروني |
| تقسيم أسطر العنوان (للتوازن) | ألّف كتابك / الإلكتروني |
| العنوان الفرعي | من الفكرة إلى أول عملية بيع |
| توقيع العلامة | كيان للبرمجيات |
| عنوان الموقع | kianalathad.com |

**مشهد الصورة (يُلصق بعد البرومبت الأساسي):**

```
A tablet standing upright showing an open ebook spread made of abstract layout (heading bars, an image placeholder, gray text lines). In front of it a plain book-cover mockup with a smooth gradient and NO title or text on it. Beside them a pencil, a small stack of pages, and a generic PDF-style file icon (a page with a folded corner, no letters on it).
```

**النص البديل (Alt) للصورة:** كتاب إلكتروني معروض على شاشتي جوال وحاسوب لوحي


### الدرس 8: من أين تبدأ في تعلم البرمجة؟ خارطة طريق للمبتدئين

**ملف الصورة:** `where-to-start-learning-programming.jpg`  ·  **المقاس:** 1200×630

**النصوص التي تُكتب على الصورة (حرفياً، بدون تغيير). العلامة `/` في صف التقسيم تعني نزول سطر جديد ولا تُكتب على الصورة:**

| الطبقة | النص |
|---|---|
| الشارة | تعلم البرمجة |
| العنوان الرئيسي | من أين تبدأ في البرمجة؟ |
| تقسيم أسطر العنوان (للتوازن) | من أين تبدأ / في البرمجة؟ |
| العنوان الفرعي | خارطة طريق للمبتدئين |
| توقيع العلامة | كيان للبرمجيات |
| عنوان الموقع | kianalathad.com |

**مشهد الصورة (يُلصق بعد البرومبت الأساسي):**

```
A winding roadmap path from the bottom-left rising toward the upper-middle, with five milestone stations: a laptop whose screen shows colored horizontal bars standing for code (not readable), a terminal window showing only a chevron prompt and a cursor block, a git-branch graph made of nodes and lines, a bug-fix magnifier icon, and a gold flag at the top as the finish. No readable code or letters anywhere.
```

**النص البديل (Alt) للصورة:** خارطة طريق لتعلم البرمجة للمبتدئين


### الدرس 9: تطبيقات Flutter: من الفكرة إلى النشر على المتاجر

**ملف الصورة:** `flutter-app-development-guide.jpg`  ·  **المقاس:** 1200×630

**النصوص التي تُكتب على الصورة (حرفياً، بدون تغيير). العلامة `/` في صف التقسيم تعني نزول سطر جديد ولا تُكتب على الصورة:**

| الطبقة | النص |
|---|---|
| الشارة | تطبيقات الجوال |
| العنوان الرئيسي | تطبيقات Flutter |
| تقسيم أسطر العنوان (للتوازن) | تطبيقات Flutter (سطر واحد) |
| العنوان الفرعي | من الفكرة إلى النشر على المتاجر |
| توقيع العلامة | كيان للبرمجيات |
| عنوان الموقع | kianalathad.com |

**مشهد الصورة (يُلصق بعد البرومبت الأساسي):**

```
Two generic smartphones side by side (one Android-style, one iPhone-style, no brand marks) both displaying the same simple app UI: a list of cards and a round floating action button. Behind and beneath them, stacked translucent layers of UI blocks like building layers (widgets). At the side a small shop awning icon with an upload arrow, representing publishing to the stores. Do NOT draw the Flutter logo, the Google Play logo or the Apple logo.
```

**النص البديل (Alt) للصورة:** تطبيق Flutter واحد يعمل على أندرويد وآيفون


## 7) قائمة فحص الجودة قبل الرفع

- [ ] المقاس بالضبط **1200×630**، والحجم أقل من 250 كيلوبايت.
- [ ] كل النصوص داخل **المنطقة الآمنة** (x من 110 إلى 1090).
- [ ] النصوص مطابقة **حرفاً بحرف** للجداول أعلاه، وبدون أخطاء في الهمزات والتشكيل المقصود.
- [ ] العنوان الرئيسي لا يتجاوز **ثلاثة أسطر** وحجمه **72 بكسل** أو أكبر.
- [ ] صغّر الصورة إلى عرض 290 بكسلاً وتأكد أن العنوان ما زال مقروءاً.
- [ ] لا يوجد في المشهد **أي شعار أو علامة تجارية أو حروف مقروءة** غير نصوصك.
- [ ] المشهد في **النصف الأيسر**، والنصف الأيمن هادئ خلف النص.
- [ ] تباين النص مع الخلفية واضح (أبيض على بنفسجي داكن).
- [ ] اسم الملف هو `slug` الدرس.
- [ ] أضفت **النص البديل** عند رفع الصورة (أو في وصف الدرس إن لم يكن له حقل).

## 8) رفع الصورة

من لوحة التحكم ← «إدارة المحتوى» ← **المقالات** ← افتح الدرس بزر «تعديل» ← اختر الصورة من حقل **الصورة** ← **حفظ**. تظهر الصورة تلقائياً في بطاقة الدرس وفي رأس صفحته وفي معاينة المشاركة.
