#!/usr/bin/env python3
"""يحوّل صورة غلاف جاهزة (PNG أو WebP أو JPEG ثقيلة) إلى JPEG مقاس 1200x630 بحجم أقل من 250 كيلوبايت
دون أي تغيير في محتواها، ويحفظها في academy-import/covers/<slug>.jpg.

الاستخدام:  python3 content/tools/optimize_cover.py <رقم الدرس 1..9> <ملف الصورة>
"""
import argparse, glob, os, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ap = argparse.ArgumentParser(); ap.add_argument('lesson', type=int); ap.add_argument('src'); ap.add_argument('--out', default=os.path.join(ROOT, 'academy-import', 'covers')); a = ap.parse_args()
folder = glob.glob(os.path.join(ROOT, 'content', 'ready-to-paste', '%02d-*' % a.lesson))[0]
slug = open(glob.glob(os.path.join(folder, '02-*'))[0], encoding='utf-8').read().strip()
im = Image.open(a.src).convert('RGB')
if abs(im.size[0] / im.size[1] - 1200 / 630) > 0.03: sys.exit(f'نسبة الصورة {im.size} بعيدة عن 1.905؛ لن أشوّهها. أعد توليدها بنسبة 1.9:1')
im = im.resize((1200, 630), Image.LANCZOS); os.makedirs(a.out, exist_ok=True); dst = os.path.join(a.out, slug + '.jpg')
for q in (88, 85, 82, 78, 74):
    im.save(dst, quality=q, optimize=True, progressive=True)
    if os.path.getsize(dst) <= 250 * 1024: break
print(f'lesson {a.lesson} -> {os.path.relpath(dst, ROOT)}  {os.path.getsize(dst)//1024} KB  (quality {q})')
