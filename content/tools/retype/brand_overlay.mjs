// يرسم توقيع العلامة (الشعار الحقيقي من favicon.svg + «كيان للبرمجيات» + kianalathad.com) على لوح شفاف 1200×630.
// node brand_overlay.mjs out.png
import { chromium } from '../../../tests/node_modules/playwright/index.mjs';
import fs from 'fs';
const ROOT = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
// الخط يُضمَّن كـ data: URI لأن Chromium يمنع تحميل ملفات file:// من صفحة setContent فيسقط النص إلى خط النظام بصمت.
const b64 = f => fs.readFileSync(f).toString('base64');
const font = w => ['arabic', 'latin'].map(s => `@font-face{font-family:"IBM Plex Sans Arabic";font-weight:${w};src:url(data:font/woff2;base64,${b64(`${ROOT}/fonts/plex-arabic-${s}-${w}.woff2`)}) format("woff2");unicode-range:${s === 'arabic' ? 'U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF,U+200B-200F' : 'U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+2074,U+20AC,U+2122'}}`).join('');
const logo = fs.readFileSync(ROOT + '/favicon.svg', 'utf8').replace('<svg ', '<svg width="44" height="44" style="display:block" ');
const html = `<style>${font(400)}${font(700)}*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;position:relative;background:transparent;font-family:"IBM Plex Sans Arabic";color:#fff}
.sig{position:absolute;right:110px;bottom:44px;display:flex;align-items:center;gap:12px;direction:rtl}.sig b{font-size:26px;font-weight:700}
.url{position:absolute;left:110px;bottom:48px;font-size:22px;opacity:.7;direction:ltr}</style><div class="sig">${logo}<b>كيان للبرمجيات</b></div><div class="url">kianalathad.com</div>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
if ((await p.evaluate(() => [...document.fonts].filter(f => f.status === 'error').length)) > 0) throw new Error('الخط لم يُحمَّل: ستظهر الصورة بخط النظام');
await p.screenshot({ path: process.argv[2], omitBackground: true }); await b.close();
