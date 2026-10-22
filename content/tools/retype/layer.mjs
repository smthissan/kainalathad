import { chromium } from '../../../tests/node_modules/playwright/index.mjs';
import fs from 'fs';
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), OUT = process.argv[3], ROOT = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const font = w => ['arabic', 'latin'].map(s => `@font-face{font-family:"IBM Plex Sans Arabic";font-weight:${w};src:url(file://${ROOT}/fonts/plex-arabic-${s}-${w}.woff2) format("woff2");unicode-range:${s === 'arabic' ? 'U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFC,U+200C-200E' : 'U+0000-00FF,U+2000-206F'}}`).join('');
const b = await chromium.launch(); const report = {};
for (const c of cfg) {
  const pg = await b.newPage({ viewport: { width: c.W, height: c.H } });
  const html = `<style>${font(400)}${font(700)}*{margin:0;box-sizing:border-box}html,body{background:transparent;width:${c.W}px;height:${c.H}px;overflow:hidden;font-family:"IBM Plex Sans Arabic",sans-serif;direction:rtl}
  #badge{position:absolute;right:${c.W - c.R}px;top:${c.badgeTop}px;height:${c.badgeH}px;line-height:${c.badgeH}px;padding:0 ${c.badgePad}px;border-radius:${c.badgeH / 2}px;background:rgb(${c.gold});color:#1e1b4b;font-weight:700;font-size:${c.badgeFont}px;white-space:nowrap}
  #head{position:absolute;right:${c.W - c.R}px;font-weight:700;color:#fff;text-align:right;white-space:nowrap}
  #sub{position:absolute;right:${c.W - c.R}px;font-weight:400;color:#ddd6fe;text-align:right;white-space:nowrap}</style>
  <div id="badge">${c.badge}</div><div id="head">${c.head.join('<br>')}</div><div id="sub">${c.sub}</div>`;
  await pg.setContent(html); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
  const res = await pg.evaluate(c => {
    const $ = id => document.getElementById(id), L = e => e.getBoundingClientRect();
    let hs = c.headFont, ss = c.subFont;
    const place = () => { const h = $('head'), s = $('sub'); h.style.fontSize = hs + 'px'; h.style.lineHeight = (hs * 1.28) + 'px'; h.style.top = (c.badgeTop + c.badgeH + c.gapBadge) + 'px'; s.style.fontSize = ss + 'px'; s.style.lineHeight = (ss * 1.4) + 'px'; s.style.top = (L(h).bottom + c.gapSub) + 'px'; };
    place(); let guard = 0;
    while (L($('head')).left < c.limit + c.gap && hs > c.minHead && guard++ < 60) { hs -= 2; place(); }
    guard = 0; while (L($('sub')).left < c.limit + c.gap && ss > c.minSub && guard++ < 60) { ss -= 1; place(); }
    return { headFont: hs, subFont: ss, head: L($('head')).toJSON(), sub: L($('sub')).toJSON(), badge: L($('badge')).toJSON() };
  }, c);
  await pg.screenshot({ path: `${OUT}/layer-${c.id}.png`, omitBackground: true });
  report[c.id] = res; await pg.close();
}
await b.close(); fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1)); console.log('layers ok');
