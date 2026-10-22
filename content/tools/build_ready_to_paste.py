import re, glob, os, shutil
SRC='/home/user/kainalathad/content/academy/'; OUT='/home/user/kainalathad/content/ready-to-paste/'
MARK='=== ابدأ النسخ إلى «المحتوى الكامل» من السطر التالي ==='
shutil.rmtree(OUT,ignore_errors=True); os.makedirs(OUT)
cell=lambda t,k:(re.search(r'^\| '+re.escape(k)+r' \| (.+?) \|\n',t,re.M) or [None,None])[1]
# ---- image doc parse
img=open(SRC+'10-image-prompts.md',encoding='utf-8').read()
blocks=re.findall(r'```\n(.*?)\n```',img,re.S)
BASE=blocks[0].strip(); NEG=blocks[1].strip()
parts=re.split(r'\n### الدرس (\d+): ',img)[1:]
IMG={}
for i in range(0,len(parts),2):
    n=int(parts[i]); b=parts[i+1]
    IMG[n]=dict(
      badge=re.search(r'\| الشارة \| (.+?) \|',b)[1], head=re.search(r'\| العنوان الرئيسي \| (.+?) \|',b)[1],
      brk=re.search(r'\| تقسيم أسطر العنوان \(للتوازن\) \| (.+?) \|',b)[1], sub=re.search(r'\| العنوان الفرعي \| (.+?) \|',b)[1],
      scene=re.search(r'```\n(.*?)\n```',b,re.S)[1].strip(), alt=re.search(r'النص البديل \(Alt\) للصورة:\*\* (.+)',b)[1].strip(), file=re.search(r'\*\*ملف الصورة:\*\* `([^`]+)`',b)[1])
TRACK={'websites':'إنشاء المواقع','stores':'المتاجر الإلكترونية','apps':'تطبيقات الجوال','ai':'الذكاء الاصطناعي','digital-products':'بيع المنتجات الرقمية','programming':'تعلم البرمجة'}
SVC={'web-development':'تطوير المواقع (صفحة ثابتة)','app-development':'تطوير التطبيقات (صفحة ثابتة)','design':'التصميم (صفحة ثابتة)','flutter-app-development':'تطوير تطبيقات Flutter'}
PROD={'learn-engraving-ebook':'كتاب تعلّم النقش من الصفر: دليل تعليمي مصوّر خطوة بخطوة'}
MAP={}
for f in sorted(glob.glob(SRC+'0[1-9]-*.md')):
    t=open(f,encoding='utf-8').read(); n=int(os.path.basename(f)[:2])
    tr=re.search(r'\(`([^`]+)`\) \|\n',cell(t,'مسار الأكاديمية')+' |\n').group(1)
    pr=re.search(r'`([^`]+)`',cell(t,'المنتج المرتبط') or ''); pr=pr.group(1) if pr else None
    sv=re.search(r'`([^`]+)`',cell(t,'الخدمة المرتبطة')).group(1)
    MAP[n]=dict(folder=os.path.basename(f)[:-3],t=t,title=cell(t,'العنوان'),slug=re.search(r'`([^`]+)`',cell(t,'Slug')).group(1),desc=cell(t,'الوصف / المقدمة'),
      seot=cell(t,'SEO Title'),metad=cell(t,'Meta Description'),kw=cell(t,'Keywords'),ogt=cell(t,'OG Title'),ogd=cell(t,'OG Description'),body=t.split(MARK)[1].strip(),tr=tr,pr=pr,sv=sv)
def w(path,text): open(path,'w',encoding='utf-8').write(text.rstrip('\n')+'\n')
for n,d in sorted(MAP.items()):
    D=OUT+d['folder']+'/'; os.makedirs(D); im=IMG[n]
    w(D+'01-العنوان.txt',d['title']); w(D+'02-Slug.txt',d['slug']); w(D+'03-الوصف-المقدمة.txt',d['desc']); w(D+'04-المحتوى-الكامل.txt',d['body'])
    w(D+'05-المسار-والمنتج-والخدمة-من-القوائم.txt',
f"""اختر هذه القيم من القوائم المنسدلة (لا تُنسخ، بل تُختار):

مسار الأكاديمية:   {TRACK[d['tr']]}
المنتج المرتبط:    {PROD[d['pr']]+'  (إن لم تجده بهذا الاسم فاختر المنتج الذي slug الخاص به: '+d['pr']+')' if d['pr'] else 'بدون (اتركه كما هو)'}
الخدمة المرتبطة:   {SVC[d['sv']]}{'  (إن لم تجدها بهذا الاسم فاختر الخدمة التي slug الخاص بها: flutter-app-development)' if d['sv']=='flutter-app-development' else ''}""")
    w(D+'06-الصورة-البرومبت-الجاهز-للصق-في-مولد-الصور.txt',BASE+' SCENE: '+im['scene']+' '+NEG)
    lines=im['brk'].replace(' (سطر واحد)','').split(' / ')
    w(D+'07-الصورة-النصوص-التي-تكتب-عليها-بعد-التوليد.txt',
f"""المقاس: 1200×630 بكسل  ·  اسم الملف عند الحفظ: {im['file']}
الخط: IBM Plex Sans Arabic  ·  الاتجاه من اليمين لليسار والمحاذاة لليمين
كل النصوص داخل المنطقة الآمنة (من x=110 إلى x=1090، ومن y=50 إلى y=580)

1) الشارة  (Bold 26، لون النص #1e1b4b على كبسولة #c9a227، أعلى اليمين: حافتها اليمنى x=1090 وأعلاها y=64):
{im['badge']}

2) العنوان الرئيسي  (Bold 72، ارتفاع السطر 94، أبيض #ffffff، مربع من x=530 إلى x=1090 يبدأ عند y=140):
{chr(10).join(lines)}

3) العنوان الفرعي  (Regular 32، ارتفاع السطر 44، #ddd6fe، تحت العنوان بـ 24 بكسل):
{im['sub']}

4) توقيع العلامة  (أسفل اليمين عند y=586: شعار الموقع 44×44 ثم النص، Bold 26، أبيض):
كيان للبرمجيات

5) عنوان الموقع  (Regular 22، لاتيني، أبيض بشفافية 70%، أسفل اليسار عند x=110، y=560):
kianalathad.com

النص البديل للصورة (للتوثيق): {im['alt']}""")
    w(D+'08-SEO-Title.txt',d['seot']); w(D+'09-Meta-Description.txt',d['metad']); w(D+'10-Keywords.txt',d['kw']); w(D+'11-OG-Title.txt',d['ogt']); w(D+'12-OG-Description.txt',d['ogd'])
print('built',len(MAP),'lessons')
