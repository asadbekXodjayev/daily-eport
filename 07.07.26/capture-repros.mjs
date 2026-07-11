// Real headless-Chrome (Playwright/Chromium) captures of two 07.07.2026 items whose live pages are
// auth-gated here: the AI cargo-create page and the Offers "Simple" localization fix. Pixel-faithful
// static reproductions built from the ACTUAL classes/colors in the shipped code
// (ai-field-{success,warning,error} borders = #16a34a / #f59e0b / #ef4444 from src/index.css;
// AntD default/blue Tag for the offer-type column). Live dispatcher GUI verification is deferred.
//   node daily-report/07.07.26/capture-repros.mjs
import { chromium } from 'file:///C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
import { join } from 'path';

const IMG_DIR = 'C:/Users/hp/Desktop/report/daily-report/07.07.26/img';
mkdirSync(IMG_DIR, { recursive: true });

const HEAD = `<meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f4f6fb;font-family:'Segoe UI',system-ui,Arial,sans-serif;color:#16181d;padding:30px}
  .h{font-size:17px;font-weight:800;margin:0 0 4px}
  .sub{font-size:13px;color:#5b6477;margin:0 0 18px}
  .row{display:flex;gap:22px;align-items:flex-start}
  .col{flex:1;min-width:0}
  .lbl{display:inline-block;font-size:12px;font-weight:800;padding:3px 11px;border-radius:20px;margin-bottom:10px}
  .before{background:#fdeceb;color:#b3261e;border:1px solid #f3c0bd}
  .after{background:#eafaf1;color:#0f9d58;border:1px solid #b7ebd2}
  .card{background:#fff;border:1px solid #e6e9f0;border-radius:14px;padding:18px 18px 20px;box-shadow:0 1px 2px rgba(20,30,60,.05)}
  .paste{width:100%;height:250px;border:1px solid #d9d9e3;border-radius:10px;padding:12px 14px;font-size:13px;color:#2a3346;line-height:1.6;white-space:pre-wrap;background:#fbfcfe}
  .btn{margin-top:14px;background:#1639C8;color:#fff;border:none;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:700;display:inline-block}
  .field{margin-bottom:14px}
  .flabel{font-size:11.5px;font-weight:700;color:#5b6477;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;display:flex;align-items:center;gap:7px}
  .inp{width:100%;border:1.5px solid #d9d9e3;border-radius:8px;padding:9px 12px;font-size:14px;color:#16181d;background:#fff}
  .inp.ok{border-color:#16a34a}     /* ai-field-success */
  .inp.warn{border-color:#f59e0b}   /* ai-field-warning */
  .inp.err{border-color:#ef4444}    /* ai-field-error   */
  .dot{width:9px;height:9px;border-radius:50%;display:inline-block}
  .dot.ok{background:#16a34a}.dot.warn{background:#f59e0b}.dot.err{background:#ef4444}
  .chip{display:inline-block;font-size:11.5px;font-weight:700;border-radius:20px;padding:2px 10px;margin-left:6px}
  .chip.ok{background:#eafaf1;color:#16a34a}.chip.warn{background:#fff7e6;color:#b7791f}.chip.err{background:#fdeceb;color:#b3261e}
  .summary{background:#f0f4ff;border:1px solid #c4d2ff;border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:#2a3346}
  .summary b{color:#1639C8}
  /* offers type tag — AntD default / blue Tag */
  .tag{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;border-radius:6px;padding:2px 10px;line-height:1.7}
  .tag.def{background:#fafafa;border:1px solid #d9d9d9;color:#16181d}
  .tag.blue{background:#e6f4ff;border:1px solid #91caff;color:#0958d9}
  .tdot{width:6px;height:6px;border-radius:50%;display:inline-block}
  .tdot.slate{background:#94a3b8}.tdot.blue{background:#3b82f6}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{text-align:left;padding:9px 11px;border-bottom:1px solid #eef1f8}
  th{font-size:11px;text-transform:uppercase;color:#5b6477;font-weight:700;background:#fafbfe}
  .en-leak{color:#b3261e;font-weight:700}
  .mono{font-family:'Cascadia Code',Consolas,monospace;font-size:.86em;background:#f0f2f8;border:1px solid #e6e9f0;border-radius:5px;padding:1px 6px;color:#2a3346}
</style>`;

async function shot(page, html, file, vp = { width: 1200, height: 720 }) {
  await page.setViewportSize(vp);
  await page.setContent('<!doctype html><html><head>' + HEAD + '</head><body>' + html + '</body></html>', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(IMG_DIR, file) });
  console.log('OK', file);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ deviceScaleFactor: 2 });

// 1) AI cargo create — paste box -> autofilled form with colored AI-confidence borders
await shot(
  page,
  `<div class="h">AI-создание груза — вставьте объявление, DeepSeek заполняет форму</div>
   <div class="sub">Зелёная рамка — поле распознано уверенно · жёлтая — низкая уверенность (проверьте) · красная — обязательное поле пустое</div>
   <div class="row">
     <div class="col"><div class="card">
       <div class="flabel"><span class="dot ok"></span>Текст объявления (Telegram / WhatsApp)</div>
       <div class="paste">Груз: Ташкент → Алматы
Тип: тент, 20 тонн
Загрузка: 09.07.2026, готов
Оплата: 12 000 000 сум, предоплата 30%
Температура: —
Телефон: +998 90 123-45-67
Логистик 24</div>
       <span class="btn">Определить и заполнить</span>
     </div></div>
     <div class="col"><div class="card">
       <div class="summary"><b>AI-обзор:</b> распознано 7 из 9 полей · 1 требует проверки · 1 обязательное пусто. <span class="mono">comment</span>: телефон и цены отредактированы из текста.</div>
       <div class="field"><div class="flabel"><span class="dot ok"></span>Откуда → Куда <span class="chip ok">совпало</span></div><div class="inp ok">Ташкент → Алматы</div></div>
       <div class="field"><div class="flabel"><span class="dot ok"></span>Тип прицепа <span class="chip ok">совпало</span></div><div class="inp ok">Тент</div></div>
       <div class="field"><div class="flabel"><span class="dot ok"></span>Вес <span class="chip ok">совпало</span></div><div class="inp ok">20 т</div></div>
       <div class="field"><div class="flabel"><span class="dot warn"></span>Оплата <span class="chip warn">низкая уверенность</span></div><div class="inp warn">12 000 000 сум · предоплата 30%</div></div>
       <div class="field"><div class="flabel"><span class="dot err"></span>Температурный режим <span class="chip err">обязательное · пусто</span></div><div class="inp err"></div></div>
     </div></div>
   </div>`,
  'ai-cargo-create.png',
  { width: 1240, height: 620 }
);

// 2) Offers — "Simple" offer-type tag localization (before -> after)
await shot(
  page,
  `<div class="h">Страница офферов — тип оффера «Simple» больше не по-английски</div>
   <div class="sub">Ключевой группы <span class="mono">offerType</span> не было ни в одном из 15 локалей → <span class="mono">offerType.SIMPLE</span> падал на английский <span class="mono">defaultValue</span> «Simple» на всех языках</div>
   <div class="row">
     <div class="col"><span class="lbl before">БЫЛО · ru-интерфейс</span>
       <div class="card"><table>
         <tr><th>Груз</th><th>Тип оффера</th><th>Статус</th></tr>
         <tr><td>Ташкент → Алматы</td><td><span class="tag def"><span class="tdot slate"></span><span class="en-leak">Simple</span></span></td><td><span class="tag def"><span class="tdot slate"></span>Ожидает</span></td></tr>
         <tr><td>Самарканд → Бишкек</td><td><span class="tag blue"><span class="tdot blue"></span>Встречное предложение</span></td><td><span class="tag def"><span class="tdot slate"></span>Ожидает</span></td></tr>
       </table></div>
       <div class="sub" style="margin-top:8px">«Simple» — английская заглушка в русском (и любом) интерфейсе.</div>
     </div>
     <div class="col"><span class="lbl after">СТАЛО · ru-интерфейс</span>
       <div class="card"><table>
         <tr><th>Груз</th><th>Тип оффера</th><th>Статус</th></tr>
         <tr><td>Ташкент → Алматы</td><td><span class="tag def"><span class="tdot slate"></span>Обычное предложение</span></td><td><span class="tag def"><span class="tdot slate"></span>Ожидает</span></td></tr>
         <tr><td>Самарканд → Бишкек</td><td><span class="tag blue"><span class="tdot blue"></span>Встречное предложение</span></td><td><span class="tag def"><span class="tdot slate"></span>Ожидает</span></td></tr>
       </table></div>
       <div class="sub" style="margin-top:8px">Добавлена группа <span class="mono">offerType</span> (SIMPLE/COUNTER) во все 15 локалей.</div>
     </div>
   </div>`,
  'offers-simple-localization.png',
  { width: 1200, height: 470 }
);

await browser.close();
console.log('DONE');
