import { chromium } from '../../../tests/node_modules/playwright/index.mjs';
import fs from 'fs';
// node render_svg.mjs in.svg out.png width height
const [, , src, out, w, h] = process.argv; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.setContent(`<style>*{margin:0}body{background:transparent}</style>${fs.readFileSync(src, 'utf8')}`); await p.waitForTimeout(300);
await p.screenshot({ path: out, omitBackground: false, clip: { x: 0, y: 0, width: +w, height: +h } }); await b.close();
