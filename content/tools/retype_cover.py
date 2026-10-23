#!/usr/bin/env python3
"""يُصحّح نصوص صورة غلاف الدرس: يمسح النص الذي كتبه مولّد الصور (فيه غالباً تشكيل أو حروف خاطئة)
ويكتب فوقها النص الصحيح حرفياً بخط الموقع (IBM Plex Sans Arabic)، ثم يحفظ الغلاف JPEG مقاس 1200x630
في academy-import/covers/<slug>.jpg.

الاستخدام:
  python3 content/tools/retype_cover.py <رقم الدرس 1..9> <ملف الصورة المصدر> --limit <س>

--limit هو أقصى موضع أفقي (بالبكسل في الصورة المصدر) يصله الرسم التوضيحي في صفوف النص؛ النص الجديد
يُقاس تلقائياً ويُصغَّر عند الحاجة كي لا يلامسه. النصوص تُقرأ من الملف 07 داخل مجلد الدرس في ready-to-paste.
المتطلبات: Pillow وnumpy، وNode مع playwright المثبّت في tests/node_modules.
"""
import argparse, glob, json, os, re, subprocess, sys, tempfile
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(HERE, 'retype'))
from plate import clean_plate

ap = argparse.ArgumentParser(); ap.add_argument('lesson', type=int); ap.add_argument('src'); ap.add_argument('--limit', type=int, required=True)
ap.add_argument('--also', action='append', default=[], help='x0,y0,x1,y1 منطقة إضافية يجوز مسحها (نص يبدأ قبل --limit في صفوف لا يصلها الرسم)')
ap.add_argument('--no-erase', action='store_true', help='الصورة المصدر رسم بلا نص (مثل covers/*.svg بعد تحويلها): لا يُمسح شيء، يُركَّب النص فوقها مباشرة')
ap.add_argument('--slug'); ap.add_argument('--badge'); ap.add_argument('--head', help='سطور العنوان مفصولة بـ /'); ap.add_argument('--sub')
ap.add_argument('--brand', action='store_true', help='أضف توقيع العلامة (الشعار الحقيقي + الاسم + الرابط) أسفل الصورة')
ap.add_argument('--out', default=os.path.join(ROOT, 'academy-import', 'covers')); a = ap.parse_args()
if a.slug:  # غلاف لمحتوى ليس درساً: النصوص تُمرَّر مباشرة
    slug, badge, head, sub = a.slug, a.badge, [l.strip() for l in a.head.split('/')], a.sub
else:
    folder = glob.glob(os.path.join(ROOT, 'content', 'ready-to-paste', '%02d-*' % a.lesson))[0]
    rd = lambda p: open(glob.glob(os.path.join(folder, p + '*'))[0], encoding='utf-8').read()
    slug = rd('02-').strip()
    m = re.search(r'1\) الشارة[^\n]*\n(.+?)\n\n2\) العنوان الرئيسي[^\n]*\n(.+?)\n\n3\) العنوان الفرعي[^\n]*\n(.+?)\n\n', rd('07-'), re.S)
    badge, head, sub = m.group(1).strip(), [l.strip() for l in m.group(2).strip().split('\n')], m.group(3).strip()

im = Image.open(a.src).convert('RGB'); W, H = im.size; A = np.asarray(im).astype(int)
reg = A[int(H * .12):int(H * .40), int(W * .70):W]
g = (reg[..., 0] > 225) & (reg[..., 1] > 160) & (reg[..., 1] < 215) & (reg[..., 2] < 90)
gold = [int(v) for v in np.median(reg[g], axis=0)] if g.sum() > 200 else [251, 191, 36]
cfg = [dict(id='x', W=W, H=H, R=round(W * .967), limit=a.limit, gap=45, gold=gold, badge=badge, head=head, sub=sub, badgeTop=160, badgeH=76, badgePad=34, badgeFont=37, gapBadge=34, gapSub=22, headFont=106, minHead=84, subFont=46, minSub=38)]
with tempfile.TemporaryDirectory() as t:
    json.dump(cfg, open(os.path.join(t, 'cfg.json'), 'w'), ensure_ascii=False)
    subprocess.run(['node', os.path.join(HERE, 'retype', 'layer.mjs'), os.path.join(t, 'cfg.json'), t], check=True, stdout=subprocess.DEVNULL)
    rep = json.load(open(os.path.join(t, 'report.json')))['x']
    rects = [(a.limit + 5, int(H * .10), W, int(H * .80))] + [tuple(int(v) for v in r.split(',')) for r in a.also]
    plate = im if a.no_erase else clean_plate(im, rects)[0]
    out = plate.convert('RGBA'); out.alpha_composite(Image.open(os.path.join(t, 'layer-x.png')).convert('RGBA'))
os.makedirs(a.out, exist_ok=True); dst = os.path.join(a.out, slug + '.jpg')
final = out.convert('RGB').resize((1200, 630), Image.LANCZOS)
if a.brand:
    with tempfile.TemporaryDirectory() as t2:
        ov = os.path.join(t2, 'brand.png'); subprocess.run(['node', os.path.join(HERE, 'retype', 'brand_overlay.mjs'), ov], check=True)
        final = final.convert('RGBA'); final.alpha_composite(Image.open(ov).convert('RGBA')); final = final.convert('RGB')
final.save(dst, quality=86, optimize=True, progressive=True)
print(f"lesson {a.lesson} -> {os.path.relpath(dst, ROOT)}  {os.path.getsize(dst)//1024} KB  headline {rep['headFont']}px (left edge {round(rep['head']['left'])} vs limit {a.limit})")
