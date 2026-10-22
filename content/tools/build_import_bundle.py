#!/usr/bin/env python3
"""يبني حزمة الاستيراد academy-import/bundle.json من المجلد الجاهز content/ready-to-paste.

الاستخدام:  python3 content/tools/build_import_bundle.py
- يقرأ ملفات كل درس (العنوان، Slug، الوصف، المحتوى، السيو، المسار والروابط).
- إن وُجدت صورة باسم slug الدرس في academy-import/covers/ (jpg أو jpeg أو png أو webp) سجّلها في الحزمة.
"""
import json, os, re, glob
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'content', 'ready-to-paste')
OUT = os.path.join(ROOT, 'academy-import')
TRACK = {'إنشاء المواقع': 'websites', 'المتاجر الإلكترونية': 'stores', 'تطبيقات الجوال': 'apps', 'الذكاء الاصطناعي': 'ai', 'بيع المنتجات الرقمية': 'digital-products', 'تعلم البرمجة': 'programming'}
SERVICE = {'تطوير المواقع (صفحة ثابتة)': 'web-development', 'تطوير التطبيقات (صفحة ثابتة)': 'app-development', 'التصميم (صفحة ثابتة)': 'design', 'البرمجيات والحلول الرقمية (صفحة ثابتة)': 'software-development', 'تطوير تطبيقات Flutter': 'flutter-app-development'}
PRODUCT_SLUG = re.compile(r'slug الخاص به: ([a-z0-9-]+)')

def read(folder, prefix):
    name = next(f for f in sorted(os.listdir(folder)) if f.startswith(prefix))
    return open(os.path.join(folder, name), encoding='utf-8').read().rstrip('\n')

lessons = []
for d in sorted(glob.glob(os.path.join(SRC, '0[1-9]-*'))):
    choices = read(d, '05')
    get = lambda label: re.search(label + r':\s+(.+)', choices).group(1).strip()
    track = TRACK[get('مسار الأكاديمية')]
    prod = get('المنتج المرتبط')
    m = PRODUCT_SLUG.search(prod)
    product = '' if prod.startswith('بدون') else (m.group(1) if m else '')
    svc = re.sub(r'\s{2,}\(.*$', '', get('الخدمة المرتبطة')).strip()
    slug = read(d, '02')
    lesson = {'slug': slug, 'title': read(d, '01'), 'description': read(d, '03'), 'content': read(d, '04'), 'track': track,
              'relatedProduct': product, 'relatedService': SERVICE[svc],
              'seo': {'title': read(d, '08'), 'description': read(d, '09'), 'keywords': read(d, '10'), 'ogTitle': read(d, '11'), 'ogDescription': read(d, '12')}}
    for ext in ('jpg', 'jpeg', 'png', 'webp'):
        if os.path.exists(os.path.join(OUT, 'covers', f'{slug}.{ext}')):
            lesson['cover'] = f'covers/{slug}.{ext}'; break
    lessons.append(lesson)
os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, 'bundle.json'), 'w', encoding='utf-8') as f:
    json.dump({'version': 1, 'lessons': lessons}, f, ensure_ascii=False, indent=1)
print(f'{len(lessons)} lessons, {sum(1 for l in lessons if "cover" in l)} with covers ->', os.path.join(OUT, 'bundle.json'))
