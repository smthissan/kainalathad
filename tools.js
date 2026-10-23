// أدوات كيان المجانية. تعمل كلها داخل متصفح الزائر، ولا تُرسل أي بيانات إلى أي خادم.
// تُحمَّل عند فتح /tools فقط (import ديناميكي من index.html).

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (root, sel) => root.querySelector(sel);

export const TOOLS = {
  '/tools/qr-code': ['مولّد رمز QR مجاني', 'أنشئ رمز QR لأي رابط أو نص أو رقم واتساب، وحمّله بصيغة PNG أو SVG بدون تسجيل وبدون علامة مائية.'],
  '/tools/invoice': ['مولّد فواتير عربية مجاني', 'اكتب فاتورتك بالعربية بترتيب سليم من اليمين لليسار، واحفظها PDF من المتصفح مباشرة. لا تُرفع بياناتك إلى أي خادم.'],
};

export function toolsIndex() {
  return `<div class="grid">${Object.entries(TOOLS).map(([href, [t, d]]) => `<article class="card"><h2>${esc(t)}</h2><p>${esc(d)}</p><a class="btn" href="${href}">استخدم الأداة</a></article>`).join('')}</div><p class="notice" style="margin-top:16px">كل الأدوات مجانية وتعمل داخل متصفحك فقط، فلا نرى ما تكتبه فيها.</p>`;
}

export async function mount(root, path) {
  if (path === '/tools/qr-code') return mountQr(root);
  if (path === '/tools/invoice') return mountInvoice(root);
}

// ---------------------------------------------------------------- QR
const utf8 = str => { const o = []; for (let i = 0; i < str.length; i++) { let c = str.charCodeAt(i); if (c < 0x80) o.push(c); else if (c < 0x800) o.push(0xc0 | c >> 6, 0x80 | c & 63); else if (c < 0xd800 || c >= 0xe000) o.push(0xe0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63); else { i++; c = 0x10000 + ((c & 0x3ff) << 10 | str.charCodeAt(i) & 0x3ff); o.push(0xf0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63) } } return o };

const lum = h => { const v = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2] };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) };

export function qrMatrix(QR, text, level) {
  QR.stringToBytes = utf8;
  const q = QR(0, level); q.addData(text, 'Byte'); q.make();
  const n = q.getModuleCount(), m = [];
  for (let r = 0; r < n; r++) { const row = []; for (let c = 0; c < n; c++) row.push(q.isDark(r, c)); m.push(row) }
  return m;
}

export function qrSvg(m, fg, bg, quiet = 4) {
  const n = m.length, s = n + quiet * 2; let d = '';
  m.forEach((row, r) => { let c = 0; while (c < n) { if (!row[c]) { c++; continue } let e = c; while (e < n && row[e]) e++; d += `M${c + quiet} ${r + quiet}h${e - c}v1h-${e - c}z`; c = e } });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges"><rect width="${s}" height="${s}" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`;
}

async function mountQr(root) {
  root.innerHTML = `<div class="tool">
<div class="tool-form">
<label>نوع المحتوى<select id="qr-type"><option value="text">رابط أو نص</option><option value="wa">رقم واتساب</option></select></label>
<label id="qr-in-l">الرابط أو النص<textarea id="qr-text" rows="3" dir="auto" placeholder="https://example.com" maxlength="1000"></textarea></label>
<label id="qr-wa-l" hidden>رقم واتساب بالصيغة الدولية (مثال: 966501234567)<input id="qr-wa" inputmode="numeric" dir="ltr" maxlength="16"></label>
<label>مستوى تصحيح الخطأ<select id="qr-level"><option value="M">متوسط (موصى به)</option><option value="L">منخفض: رمز أبسط</option><option value="Q">مرتفع</option><option value="H">أعلى: يتحمل تلفاً أكبر</option></select></label>
<div class="row"><label>لون الرمز<input id="qr-fg" type="color" value="#1e1b4b"></label><label>لون الخلفية<input id="qr-bg" type="color" value="#ffffff"></label></div>
<label>حجم ملف PNG<select id="qr-size"><option value="512">512 بكسل</option><option value="1024" selected>1024 بكسل</option><option value="2048">2048 بكسل (للطباعة)</option></select></label>
<p id="qr-warn" class="notice" hidden></p>
</div>
<div class="tool-out"><div id="qr-out" class="qr-out" aria-live="polite"></div>
<div class="row"><button class="btn" id="qr-png" type="button">تحميل PNG</button><button class="btn secondary" id="qr-svg" type="button">تحميل SVG</button></div></div></div>
<h2>نصائح لرمز يُقرأ بسهولة</h2>
<ul><li>اختر لوناً غامقاً للرمز وفاتحاً للخلفية، والعكس لا تقرؤه بعض التطبيقات.</li><li>لا تصغّر الرمز عند الطباعة عن 2 سم، وجرّبه بجوالك قبل الطباعة.</li><li>الرمز يحمل النص نفسه ولا يمرّ بأي خادم، فلا ينتهي مفعوله، لكن إن غيّرت رابط صفحتك فلا بد من رمز جديد.</li></ul>`;
  let QR;
  const out = $(root, '#qr-out'), warn = $(root, '#qr-warn'); let cur = '';
  const val = () => $(root, '#qr-type').value === 'wa' ? ($(root, '#qr-wa').value.replace(/\D/g, '') ? 'https://wa.me/' + $(root, '#qr-wa').value.replace(/\D/g, '') : '') : $(root, '#qr-text').value.trim();
  const draw = async () => {
    $(root, '#qr-in-l').hidden = $(root, '#qr-type').value === 'wa'; $(root, '#qr-wa-l').hidden = $(root, '#qr-type').value !== 'wa';
    const t = val(), fg = $(root, '#qr-fg').value, bg = $(root, '#qr-bg').value;
    if (!QR) QR = (await import('/vendor/qrcode.mjs')).default;
    const msgs = [];
    if (contrast(fg, bg) < 3) msgs.push('التباين بين لون الرمز والخلفية ضعيف، وقد لا تقرأه بعض التطبيقات.');
    if (lum(fg) > lum(bg)) msgs.push('لون الرمز أفتح من الخلفية، وبعض القارئات لا تدعم ذلك.');
    warn.hidden = !msgs.length; warn.textContent = msgs.join(' ');
    if (!t) { cur = ''; out.innerHTML = '<p class="muted">اكتب الرابط أو النص ليظهر الرمز هنا.</p>'; return }
    try { cur = qrSvg(qrMatrix(QR, t, $(root, '#qr-level').value), fg, bg); out.innerHTML = cur; out.firstChild.setAttribute('role', 'img'); out.firstChild.setAttribute('aria-label', 'رمز QR') }
    catch { cur = ''; out.innerHTML = '<p class="notice">النص طويل جداً لرمز QR. اختصره أو اخفض مستوى تصحيح الخطأ.</p>' }
  };
  root.addEventListener('input', draw); root.addEventListener('change', draw);
  const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000) };
  $(root, '#qr-svg').onclick = () => { if (cur) save(new Blob([cur], { type: 'image/svg+xml' }), 'qr-code.svg') };
  $(root, '#qr-png').onclick = () => {
    if (!cur) return; const px = Number($(root, '#qr-size').value) || 1024, img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = px; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, px, px); c.toBlob(b => save(b, 'qr-code.png'), 'image/png') };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cur);
  };
  await draw();
}

// ---------------------------------------------------------------- فاتورة
const money = (n, cur) => { const v = Number.isFinite(n) ? n : 0; return v.toLocaleString('ar-EG-u-nu-latn', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (cur ? ' ' + cur : '') };

export function invoiceTotals(items, taxPct, discount) {
  const sub = items.reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
  const disc = Math.min(Math.max(Number(discount) || 0, 0), sub);
  const base = sub - disc, tax = base * Math.min(Math.max(Number(taxPct) || 0, 0), 100) / 100;
  return { sub, disc, tax, total: base + tax };
}

function mountInvoice(root) {
  const today = new Date().toISOString().slice(0, 10);
  root.innerHTML = `<div class="tool inv-tool">
<div class="tool-form">
<div class="row"><label>اسم البائع / الشركة<input id="iv-from" maxlength="120"></label><label>اسم العميل<input id="iv-to" maxlength="120"></label></div>
<div class="row"><label>رقم الفاتورة<input id="iv-no" value="001" maxlength="30" dir="ltr"></label><label>التاريخ<input id="iv-date" type="date" value="${today}"></label><label>العملة<input id="iv-cur" value="USD" maxlength="8" dir="ltr"></label></div>
<label>الرقم الضريبي للبائع (إن وُجد)<input id="iv-tax-no" maxlength="40" dir="ltr"></label>
<h3>البنود</h3><div id="iv-items"></div><button class="btn secondary" id="iv-add" type="button">+ إضافة بند</button>
<div class="row"><label>الخصم (مبلغ)<input id="iv-disc" type="number" min="0" step="any" value="0" dir="ltr"></label><label>الضريبة %<input id="iv-tax" type="number" min="0" max="100" step="any" value="0" dir="ltr"></label></div>
<label>ملاحظات (طريقة الدفع، شروط)<textarea id="iv-note" rows="3" maxlength="600"></textarea></label>
<p class="notice">هذه فاتورة بسيطة للاستخدام العام. لا تُعدّ فاتورة إلكترونية معتمدة لدى هيئة الضرائب في بلدك، فإن كان نظامك يوجب فاتورة معتمدة فاستخدم النظام الرسمي. وبياناتك تبقى في متصفحك ولا تُرسل لأي جهة.</p>
</div>
<div class="tool-out"><div id="iv-print" class="inv-sheet"></div><button class="btn" id="iv-pdf" type="button">طباعة / حفظ PDF</button></div></div>`;
  const list = $(root, '#iv-items');
  const addRow = (d = '', q = 1, p = '') => { const r = document.createElement('div'); r.className = 'iv-row'; r.innerHTML = `<input class="d" placeholder="الوصف" maxlength="200" value="${esc(d)}" aria-label="وصف البند"><input class="q" type="number" min="0" step="any" value="${q}" dir="ltr" aria-label="الكمية"><input class="p" type="number" min="0" step="any" value="${p}" placeholder="السعر" dir="ltr" aria-label="سعر الوحدة"><button type="button" class="x" aria-label="حذف البند">×</button>`; r.querySelector('.x').onclick = () => { if (list.children.length > 1) { r.remove(); draw() } }; list.appendChild(r) };
  const g = s => $(root, s).value;
  const draw = () => {
    const items = [...list.children].map(r => ({ d: r.querySelector('.d').value, qty: r.querySelector('.q').value, price: r.querySelector('.p').value })).filter(i => i.d || Number(i.price));
    const t = invoiceTotals(items, g('#iv-tax'), g('#iv-disc')), cur = g('#iv-cur').trim();
    $(root, '#iv-print').innerHTML = `<h2>فاتورة</h2>
<div class="iv-meta"><div><b>رقم الفاتورة:</b> <span dir="ltr">${esc(g('#iv-no'))}</span></div><div><b>التاريخ:</b> <span dir="ltr">${esc(g('#iv-date'))}</span></div></div>
<div class="iv-parties"><div><b>من</b><br>${esc(g('#iv-from')) || '—'}${g('#iv-tax-no') ? `<br>الرقم الضريبي: <span dir="ltr">${esc(g('#iv-tax-no'))}</span>` : ''}</div><div><b>إلى</b><br>${esc(g('#iv-to')) || '—'}</div></div>
<table><thead><tr><th>الوصف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${items.map(i => `<tr><td>${esc(i.d)}</td><td dir="ltr">${esc(i.qty)}</td><td dir="ltr">${money(Number(i.price) || 0)}</td><td dir="ltr">${money((Number(i.qty) || 0) * (Number(i.price) || 0))}</td></tr>`).join('') || '<tr><td colspan="4">لا توجد بنود</td></tr>'}</tbody></table>
<div class="iv-sum"><div><span>المجموع</span><span dir="ltr">${money(t.sub, cur)}</span></div>${t.disc ? `<div><span>الخصم</span><span dir="ltr">- ${money(t.disc, cur)}</span></div>` : ''}${Number(g('#iv-tax')) ? `<div><span>الضريبة (${esc(g('#iv-tax'))}%)</span><span dir="ltr">${money(t.tax, cur)}</span></div>` : ''}<div class="tot"><span>الإجمالي المستحق</span><span dir="ltr">${money(t.total, cur)}</span></div></div>
${g('#iv-note').trim() ? `<p class="iv-note"><b>ملاحظات:</b> ${esc(g('#iv-note')).replace(/\n/g, '<br>')}</p>` : ''}`;
  };
  addRow('', 1, ''); $(root, '#iv-add').onclick = () => { addRow(); draw() };
  root.addEventListener('input', draw); draw();
  $(root, '#iv-pdf').onclick = () => { document.body.classList.add('print-invoice'); const done = () => { document.body.classList.remove('print-invoice'); removeEventListener('afterprint', done) }; addEventListener('afterprint', done); print() };
}
