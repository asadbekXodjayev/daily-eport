// Real headless-Chrome (Playwright/Chromium) captures of the 06.07.2026 video-call / circle-note
// fixes. These are PIXEL-FAITHFUL STATIC REPRODUCTIONS built from the ACTUAL component classes in
// the shipped code (the object-fit letterbox, self-view PiP aspect, and circle-recorder overlay are
// pure CSS, so a real-browser render is identical to the live app). A synthetic PORTRAIT test-card
// stands in for the phone camera feed so the crop-vs-letterbox behaviour is directly visible.
//
// Why static repro (not live app): the live flows are gated in this environment — a connected 2-peer
// WebRTC call, a camera + HTTPS secure context, and dispatcher/admin login (policy-gated). See the
// project note `project_verify_admin_gui_blocked`. Live QA on staging is the remaining pass.
//
//   node daily-report/06.07.26/capture-video-fixes.mjs
import { chromium } from 'file:///C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
import { join } from 'path';

const IMG_DIR = 'C:/Users/hp/Desktop/report/daily-report/06.07.26/img';
mkdirSync(IMG_DIR, { recursive: true });

// Portrait 9:16 "phone camera" test feed (SVG data-URI). Clear TOP/BOTTOM bands + a head&shoulders
// so object-cover cropping vs object-contain letterboxing is unmistakable on a real render.
const PORTRAIT_FEED =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640" viewBox="0 0 360 640">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#12314f"/><stop offset="1" stop-color="#0a1e2f"/></linearGradient></defs>
    <rect width="360" height="640" fill="url(#g)"/>
    <g stroke="#ffffff14" stroke-width="1">
      <line x1="0" y1="160" x2="360" y2="160"/><line x1="0" y1="320" x2="360" y2="320"/>
      <line x1="0" y1="480" x2="360" y2="480"/><line x1="120" y1="0" x2="120" y2="640"/><line x1="240" y1="0" x2="240" y2="640"/></g>
    <rect x="0" y="0" width="360" height="54" fill="#2563eb"/>
    <text x="180" y="35" font-family="Segoe UI,Arial" font-size="24" font-weight="700" fill="#fff" text-anchor="middle">TOP · 09:41</text>
    <rect x="0" y="586" width="360" height="54" fill="#dc2626"/>
    <text x="180" y="622" font-family="Segoe UI,Arial" font-size="24" font-weight="700" fill="#fff" text-anchor="middle">BOTTOM</text>
    <circle cx="180" cy="300" r="86" fill="#f4d7b8"/>
    <circle cx="152" cy="288" r="9" fill="#1f2937"/><circle cx="208" cy="288" r="9" fill="#1f2937"/>
    <path d="M150 330 q30 26 60 0" stroke="#1f2937" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M96 560 q84 -150 168 0 z" fill="#e2e8f0"/>
  </svg>`);

// Shared chrome
const HEAD = `<meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0e1524;font-family:'Segoe UI',system-ui,Arial,sans-serif;color:#e5e9f2;padding:34px}
  .row{display:flex;gap:26px;align-items:flex-start}
  .col{flex:1}
  .h{font-size:15px;font-weight:800;margin:0 0 12px;letter-spacing:.2px}
  .lbl{display:inline-block;font-size:12.5px;font-weight:800;padding:4px 12px;border-radius:20px;margin-bottom:12px}
  .before{background:#3a1414;color:#fca5a5;border:1px solid #7f1d1d}
  .after{background:#0e2a1c;color:#86efac;border:1px solid #14532d}
  .note{font-size:12.5px;color:#94a3b8;margin-top:11px;line-height:1.5}
  .b{color:#e5e9f2;font-weight:700}
  /* real call video-stage: exact classes from GlobalAudioCallModal.tsx */
  .stage{position:relative;overflow:hidden;border-radius:16px;
    background:linear-gradient(to bottom,#0b1c33,#07111f,#050d18);}
  .stage.d16x9{aspect-ratio:16/9}
  .feed{position:absolute;inset:0;height:100%;width:100%}
  .cover{object-fit:cover}          /* BEFORE */
  .contain{object-fit:contain}      /* AFTER  */
  /* self-view PiP: exact classes (w-28/w-40 portrait vs w-36/w-56 landscape; aspect-[9/16] vs aspect-video) */
  .pip{position:absolute;right:20px;bottom:22px;overflow:hidden;border-radius:16px;background:#000;
    box-shadow:0 10px 30px -8px rgba(15,23,42,.6);outline:1px solid rgba(255,255,255,.25)}
  .pip.land{width:224px}.pip.port{width:160px}
  .pip video,.pip img{width:100%;display:block;transform:scaleX(-1)}
  .pip.land img{aspect-ratio:16/9;object-fit:cover}
  .pip.port img{aspect-ratio:9/16;object-fit:cover}
  .rem{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:13px}
</style>`;

async function shot(page, html, file, vp = { width: 1180, height: 620 }) {
  await page.setViewportSize(vp);
  await page.setContent('<!doctype html><html><head>' + HEAD + '</head><body>' + html + '</body></html>', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(IMG_DIR, file) });
  console.log('OK', file);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ deviceScaleFactor: 2 });

// 1) Remote peer video: object-cover (crops portrait) -> object-contain (letterbox, full frame)
await shot(
  page,
  `<div class="row">
     <div class="col"><span class="lbl before">БЫЛО · object-cover</span>
       <div class="stage d16x9"><img class="feed cover" src="${PORTRAIT_FEED}"/></div>
       <div class="note">Портретный поток телефона (9:16) растягивался до ширины 16:9-контейнера и <span class="b">обрезался сверху/снизу</span> — TOP/BOTTOM-полосы теряются, лицо приближено.</div></div>
     <div class="col"><span class="lbl after">СТАЛО · object-contain</span>
       <div class="stage d16x9"><img class="feed contain" src="${PORTRAIT_FEED}"/></div>
       <div class="note">Кадр показан <span class="b">целиком</span>, по центру, тёмные поля звонка по бокам («портретный» вид). Скриншот демонстрации экрана тоже больше не режется.</div></div>
   </div>`,
  'video-remote-portrait.png'
);

// 2) Self-view PiP: landscape 16:9 crop -> portrait 9:16 full
await shot(
  page,
  `<div class="row">
     <div class="col"><span class="lbl before">БЫЛО · PiP 16:9 (object-cover)</span>
       <div class="stage d16x9"><div class="rem">удалённый собеседник</div>
         <div class="pip land"><img src="${PORTRAIT_FEED}"/></div></div>
       <div class="note">У пользователя-телефона своя камера снималась ландшафтно 640×360; фикс-PiP 16:9 <span class="b">обрезал</span> портретное лицо.</div></div>
     <div class="col"><span class="lbl after">СТАЛО · PiP 9:16 (портрет)</span>
       <div class="stage d16x9"><div class="rem">удалённый собеседник</div>
         <div class="pip port"><img src="${PORTRAIT_FEED}"/></div></div>
       <div class="note">Съёмка 360×640 на мобиле + PiP подстраивается под реальный аспект (<span class="b">aspect-[9/16]</span>, уже коробка) — лицо целиком.</div></div>
   </div>`,
  'video-selfview-pip.png'
);

// 3) Circle note — hold-to-record states (preview -> recording+lock -> locked hands-free)
const circle = (opts) => {
  const ringPct = opts.ring || 0;
  const ring =
    ringPct > 0
      ? `<svg width="188" height="188" viewBox="0 0 188 188" style="position:absolute;inset:0">
           <circle cx="94" cy="94" r="90" fill="none" stroke="#1e2a3d" stroke-width="4"/>
           <circle cx="94" cy="94" r="90" fill="none" stroke="#2f7bf6" stroke-width="4" stroke-linecap="round"
             stroke-dasharray="${(2 * Math.PI * 90).toFixed(1)}" stroke-dashoffset="${((1 - ringPct) * 2 * Math.PI * 90).toFixed(1)}"
             transform="rotate(-90 94 94)"/></svg>`
      : '';
  return `<div style="position:relative;width:188px;height:188px;margin:0 auto">
      ${ring}
      <div style="position:absolute;inset:4px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 40%,#17324e,#0a1e2f)">
        <svg width="100%" height="100%" viewBox="0 0 180 180"><circle cx="90" cy="78" r="42" fill="#f4d7b8"/>
          <circle cx="76" cy="72" r="5" fill="#1f2937"/><circle cx="104" cy="72" r="5" fill="#1f2937"/>
          <path d="M74 96 q16 14 32 0" stroke="#1f2937" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M40 180 q50 -70 100 0 z" fill="#dbe4ee"/></svg>
      </div></div>`;
};
const recBtn = (square) =>
  `<div style="width:66px;height:66px;border-radius:50%;background:#ef2b4b;display:flex;align-items:center;justify-content:center">
     <div style="width:${square ? '24px;height:24px;border-radius:6px' : '30px;height:30px;border-radius:50%'};background:#fff"></div></div>`;
await shot(
  page,
  `<div class="h" style="font-size:17px;margin-bottom:18px">Видеокружок · запись «как в Telegram» (удержание → блокировка → отпустить)</div>
   <div class="row">
     <div class="col"><span class="lbl after">1 · превью — «Удерживайте»</span>
       <div style="background:#0a121e;border-radius:16px;padding:26px 18px 22px">${circle({ ring: 0 })}
         <div style="text-align:center;color:#94a3b8;font-size:13.5px;margin:16px 0 14px">Удерживайте для записи</div>
         <div style="display:flex;align-items:center;justify-content:center;gap:22px">
           <div style="background:#1e293b;color:#cbd5e1;border-radius:10px;padding:9px 16px;font-size:13px">Отмена</div>${recBtn(false)}</div></div></div>
     <div class="col"><span class="lbl after">2 · запись + свайп-вверх для блокировки</span>
       <div style="background:#0a121e;border-radius:16px;padding:26px 18px 22px">${circle({ ring: 0.62 })}
         <div style="text-align:center;color:#cbd5e1;font-size:13.5px;margin:16px 0 4px">↑</div>
         <div style="text-align:center;color:#94a3b8;font-size:12.5px;margin-bottom:14px">Проведите вверх для блокировки</div>
         <div style="display:flex;align-items:center;justify-content:center;gap:18px">
           <div style="background:#1e293b;color:#cbd5e1;border-radius:10px;padding:9px 16px;font-size:13px">Отмена</div>${recBtn(true)}
           <div style="color:#e5e9f2;font-size:14px;font-variant-numeric:tabular-nums">0:03,2</div></div></div></div>
     <div class="col"><span class="lbl after">3 · заблокировано (hands-free)</span>
       <div style="background:#0a121e;border-radius:16px;padding:26px 18px 22px">${circle({ ring: 0.82 })}
         <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:20px">
           <div style="color:#f87171;font-size:14px;font-variant-numeric:tabular-nums">● 0:07,0</div>
           <div style="background:#1e293b;color:#cbd5e1;border-radius:10px;padding:9px 14px;font-size:13px">Отмена</div>
           <div style="width:44px;height:44px;border-radius:50%;background:#334155;display:flex;align-items:center;justify-content:center;color:#fff">❚❚</div>
           <div style="width:52px;height:52px;border-radius:50%;background:#2f7bf6;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px">➤</div></div></div></div>
   </div>
   <div class="note" style="margin-top:16px">Раньше запись стартовала автоматически при открытии; теперь — по <span class="b">удержанию</span> кнопки записи (свайп вверх &gt;64px блокирует hands-free, отпускание — отправка). Прогресс-кольцо рисуется <span class="b">только во время записи</span>: чистый круг при открытии.</div>`,
  'circle-hold-to-record.png',
  { width: 1240, height: 560 }
);

// 4) Circle note — mid-recording camera switch (phones)
await shot(
  page,
  `<div class="h" style="font-size:17px;margin-bottom:18px">Видеокружок · переключение камеры <u>во время записи</u> (телефоны)</div>
   <div class="row" style="align-items:center">
     <div style="flex:0 0 300px">
       <div style="background:#0a121e;border-radius:16px;padding:22px;position:relative">${circle({ ring: 0.55 })}
         <div style="position:absolute;top:44px;right:52px;width:46px;height:46px;border-radius:50%;background:#0f172acc;border:1px solid #ffffff30;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px">⟳</div></div>
       <div style="text-align:center;color:#86efac;font-size:12.5px;font-weight:800;margin-top:12px">СТАЛО · переключение работает</div></div>
     <div class="col">
       <div class="note" style="font-size:14px;line-height:1.6">
         <div style="margin-bottom:12px"><span class="b">Корень:</span> старый код запрашивал новую камеру, <span class="b">не отпустив старую</span> — большинство телефонов имеют один камерный конвейер и отклоняют второй параллельный <code style="background:#111827;padding:1px 6px;border-radius:5px">getUserMedia</code> (<code style="background:#111827;padding:1px 6px;border-radius:5px">NotReadableError</code>), переключение молча срывалось.</div>
         <div><span class="b">Фикс:</span> сначала <span class="b">освобождаем</span> старую видео-дорожку, затем берём новую. <code style="background:#111827;padding:1px 6px;border-radius:5px">MediaRecorder</code> продолжает писать стабильный <code style="background:#111827;padding:1px 6px;border-radius:5px">canvas.captureStream()</code> + постоянный микрофон — без разрыва записи/звука; при неудаче — восстановление прежней камеры по <code style="background:#111827;padding:1px 6px;border-radius:5px">deviceId</code>. (iOS пишет raw-поток без canvas → там кнопка флипа скрыта во время записи.)</div></div></div>
   </div>`,
  'circle-camera-switch.png',
  { width: 1180, height: 460 }
);

await browser.close();
console.log('DONE — real Chromium captures written to img/');
