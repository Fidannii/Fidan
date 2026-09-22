import './style.css';
import type { BuildId, Game, Res } from './core/types';
import {
  BUILD_ORDER,
  DEFS,
  HOUSE,
  RES,
  buy,
  cell,
  city,
  collect,
  demolish,
  expand,
  load,
  place,
  prog,
  reset,
  save,
  sell,
  speedUp,
  tick,
  upgradeHouse,
} from './core/sim';
import { View } from './render/view';

const hud = document.querySelector<HTMLElement>('#hud')!;
const panel = document.querySelector<HTMLElement>('#panel')!;
const bar = document.querySelector<HTMLElement>('#build-bar')!;
const toastEl = document.querySelector<HTMLElement>('#toast')!;
const modal = document.querySelector<HTMLElement>('#modal-root')!;
const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;

let g: Game = load();
const view = new View(canvas);
view.center(g);

let toastT = 0;
function say(msg: string) {
  toastEl.hidden = false;
  toastEl.textContent = msg;
  clearTimeout(toastT);
  toastT = window.setTimeout(() => {
    toastEl.hidden = true;
  }, 2000);
}

function paintHud() {
  const s = city(g);
  hud.innerHTML = `
    <div class="brand">MetroBuilder</div>
    <div class="stat">💰 ${g.cash} <span>Credits</span></div>
    <div class="stat">💎 ${g.gems} <span>Gems</span></div>
    <div class="stat">👥 ${s.pop} <span>Einw.</span></div>
    <div class="stat">😊 ${s.sat}% <span>Zufrieden</span></div>
    <div class="stat">📈 ${s.tax} <span>/15s</span></div>
    <div class="stat">⭐ Lv ${g.level}</div>
  `;
}

function paintBar() {
  bar.innerHTML = BUILD_ORDER.map((id) => {
    const d = DEFS[id];
    return `<button class="build-btn ${g.selected === id ? 'active' : ''}" data-id="${id}" title="${d.blurb}">
      <span class="emoji">${d.icon}</span>
      <span>${d.name}</span>
      <span class="cost">${d.cost}¢</span>
    </button>`;
  }).join('');
}

function invHtml() {
  return Object.entries(RES)
    .map(
      ([id, m]) =>
        `<div><span>${m.icon} ${m.name}</span><strong>${g.inv[id as Res]}</strong></div>`,
    )
    .join('');
}

function questHtml() {
  return g.quests
    .map((q) => {
      const pct = Math.round((q.cur / q.max) * 100);
      return `<div class="quest ${q.done ? 'done' : ''}">
        <strong>${q.done ? '✓ ' : ''}${q.title}</strong>
        <div class="muted">${q.cur}/${q.max} · +${q.rewardCash}¢</div>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </div>`;
    })
    .join('');
}

function paintPanel() {
  const f = g.focus ? cell(g, g.focus.x, g.focus.y) : null;
  const s = city(g);

  if (f?.b) {
    const d = DEFS[f.b.id];
    const p = prog(g, f.x, f.y);
    const next = f.b.id === 'house' ? HOUSE.find((h) => h.level === f.b!.level + 1) : null;
    const tier = f.b.id === 'house' ? HOUSE[f.b.level - 1] : null;
    panel.innerHTML = `
      <h2>${d.icon} ${d.name}</h2>
      <p class="muted">${d.blurb}</p>
      <p class="muted">Feld ${f.x},${f.y}${tier ? ` · ${tier.name} · ${tier.pop} Einw.` : ''}</p>
      ${
        d.produce
          ? `<div class="prog"><i style="width:${Math.round(p * 100)}%"></i></div>
             <p class="muted">${f.b.ready > 0 ? 'Fertig — einsammeln' : f.b.jobAt ? `${Math.round(p * 100)}% Produktion` : 'Wartet auf Input'}</p>`
          : ''
      }
      ${f.b.wear > 15 ? `<p class="muted">⚠️ Abnutzung ${Math.round(f.b.wear)}% — Strom/Wasser/Straße prüfen</p>` : ''}
      <div class="row">
        ${f.b.ready > 0 ? `<button id="a-collect" class="primary">Einsammeln</button>` : ''}
        ${d.produce && f.b.jobAt ? `<button id="a-speed">⚡ 1 Gem</button>` : ''}
        ${next ? `<button id="a-up" class="primary">→ ${next.name} (${next.cost}¢)</button>` : ''}
        <button id="a-demo" class="danger">Abreißen</button>
        <button id="a-close" class="ghost">Schließen</button>
      </div>
      ${
        next
          ? `<h3>Upgrade braucht</h3><p class="muted">${
              Object.entries(next.needs)
                .map(([r, n]) => `${RES[r as Res].icon}×${n}`)
                .join(' · ') || '—'
            }</p>`
          : ''
      }
      <h3>Inventar</h3><div class="inv">${invHtml()}</div>
      <h3>Quests</h3>${questHtml()}
      <div class="row"><button id="a-expand">🔓 Erweitern</button><button id="a-market">🏪 Markt</button></div>
    `;
  } else {
    panel.innerHTML = `
      <h2>Kernschleife</h2>
      <ol class="loop">
        <li>Holz fällen</li>
        <li>Bretter sägen</li>
        <li>Häuser upgraden</li>
        <li>Zufriedenheit & Steuern</li>
        <li>Stadt erweitern</li>
      </ol>
      <p class="muted" style="margin-top:0.7rem">${s.houses} Häuser · ${s.pop} Einw. · Steuern ${s.tax}¢ / 15s</p>
      <div class="row">
        <button id="a-expand" class="primary">🔓 Erweitern</button>
        <button id="a-market">🏪 Markt</button>
        <button id="a-reset" class="danger">Reset</button>
      </div>
      <h3>Inventar</h3><div class="inv">${invHtml()}</div>
      <h3>Quests</h3>${questHtml()}
      ${f && !f.b ? `<p class="muted" style="margin-top:0.6rem">Leeres Feld ${f.x},${f.y} — Baumenü unten wählen.</p>` : ''}
    `;
  }
  wire();
}

function wire() {
  panel.querySelector('#a-collect')?.addEventListener('click', () => {
    if (!g.focus) return;
    collect(g, g.focus.x, g.focus.y, say);
    refresh();
  });
  panel.querySelector('#a-speed')?.addEventListener('click', () => {
    if (!g.focus) return;
    speedUp(g, g.focus.x, g.focus.y, say);
    refresh();
  });
  panel.querySelector('#a-up')?.addEventListener('click', () => {
    if (!g.focus) return;
    upgradeHouse(g, g.focus.x, g.focus.y, say);
    refresh();
  });
  panel.querySelector('#a-demo')?.addEventListener('click', () => {
    if (!g.focus) return;
    demolish(g, g.focus.x, g.focus.y, say);
    refresh();
  });
  panel.querySelector('#a-close')?.addEventListener('click', () => {
    g.focus = null;
    g.selected = null;
    refresh();
  });
  panel.querySelector('#a-expand')?.addEventListener('click', () => {
    expand(g, say);
    refresh();
  });
  panel.querySelector('#a-market')?.addEventListener('click', openMarket);
  panel.querySelector('#a-reset')?.addEventListener('click', () => {
    if (confirm('Neuen Kernstand starten?')) {
      g = reset();
      view.center(g);
      say('Neustart.');
      refresh();
    }
  });
}

function openMarket() {
  modal.innerHTML = `
    <div class="modal">
      <h2>🏪 Markt</h2>
      <p class="muted">Kauf verkürzt Wartezeiten — Kernfortschritt ohne Premium möglich.</p>
      <div class="inv" style="margin-top:0.7rem">
        ${Object.entries(RES)
          .map(([id, m]) => {
            const buyP = m.sell * 4;
            return `<div style="flex-direction:column;align-items:stretch;gap:0.3rem;display:flex">
              <div style="display:flex;justify-content:space-between"><span>${m.icon} ${m.name}</span><strong>${g.inv[id as Res]}</strong></div>
              <div class="row">
                <button data-buy="${id}">Kauf ${buyP}¢</button>
                <button data-sell="${id}">Verkauf ${m.sell}¢</button>
              </div>
            </div>`;
          })
          .join('')}
      </div>
      <div class="row" style="margin-top:0.9rem"><button id="m-close" class="primary">Fertig</button></div>
    </div>`;
  modal.querySelector('#m-close')?.addEventListener('click', () => {
    modal.innerHTML = '';
  });
  modal.querySelectorAll('[data-buy]').forEach((el) => {
    el.addEventListener('click', () => {
      buy(g, (el as HTMLElement).dataset.buy as Res, say);
      openMarket();
      refresh();
    });
  });
  modal.querySelectorAll('[data-sell]').forEach((el) => {
    el.addEventListener('click', () => {
      sell(g, (el as HTMLElement).dataset.sell as Res, say);
      openMarket();
      refresh();
    });
  });
}

function refresh() {
  paintHud();
  paintBar();
  paintPanel();
  save(g);
}

bar.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
  if (!btn) return;
  const id = btn.dataset.id as BuildId;
  g.selected = g.selected === id ? null : id;
  refresh();
});

let drag = false;
let moved = false;
let lx = 0;
let ly = 0;
const pts = new Map<number, { x: number; y: number }>();
let pinch0 = 0;
let scale0 = 1;

function pos(e: PointerEvent) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  drag = true;
  moved = false;
  lx = e.clientX;
  ly = e.clientY;
  if (pts.size === 2) {
    const [a, b] = [...pts.values()];
    pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
    scale0 = view.scale;
  }
});

canvas.addEventListener('pointermove', (e) => {
  const p = pos(e);
  const w = view.toWorld(p.x, p.y);
  view.hover = { x: Math.floor(w.x), y: Math.floor(w.y) };
  if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pts.size === 2) {
    const [a, b] = [...pts.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch0 > 0) view.scale = Math.min(2.4, Math.max(0.5, scale0 * (d / pinch0)));
    moved = true;
    return;
  }
  if (!drag) return;
  const dx = e.clientX - lx;
  const dy = e.clientY - ly;
  if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
  view.camX += dx;
  view.camY += dy;
  lx = e.clientX;
  ly = e.clientY;
});

canvas.addEventListener('pointerup', (e) => {
  pts.delete(e.pointerId);
  if (pts.size < 2) pinch0 = 0;
  if (!drag) return;
  drag = false;
  if (moved) return;

  const p = pos(e);
  const w = view.toWorld(p.x, p.y);
  const x = Math.floor(w.x);
  const y = Math.floor(w.y);
  const c = cell(g, x, y);
  if (!c) return;

  if (c.b && c.b.ready > 0 && !g.selected) {
    collect(g, x, y, say);
    g.focus = { x, y };
    refresh();
    return;
  }

  if (g.selected) {
    place(g, x, y, g.selected, say);
    if (g.selected !== 'road') g.selected = null;
    g.focus = { x, y };
    refresh();
    return;
  }

  g.focus = { x, y };
  refresh();
});

canvas.addEventListener('pointercancel', (e) => {
  pts.delete(e.pointerId);
  drag = false;
});

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const before = view.scale;
    view.scale = Math.min(2.4, Math.max(0.5, view.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
    const p = pos(e as unknown as PointerEvent);
    view.camX = p.x - ((p.x - view.camX) / before) * view.scale;
    view.camY = p.y - ((p.y - view.camY) / before) * view.scale;
  },
  { passive: false },
);

function frame() {
  tick(g, say);
  view.draw(g);
  requestAnimationFrame(frame);
}

if (!localStorage.getItem('metrobuilder-core-intro')) {
  modal.innerHTML = `
    <div class="modal">
      <h2>MetroBuilder — Kern</h2>
      <p class="muted">Von der Kernschleife aufgebaut:</p>
      <ol class="loop">
        <li>Straße anschließen</li>
        <li>Holz produzieren</li>
        <li>Zu Brettern verarbeiten</li>
        <li>Häuser upgraden</li>
        <li>Versorgung halten → Steuern kassieren</li>
      </ol>
      <div class="row" style="margin-top:0.9rem"><button id="go" class="primary">Stadt starten</button></div>
    </div>`;
  modal.querySelector('#go')?.addEventListener('click', () => {
    localStorage.setItem('metrobuilder-core-intro', '1');
    modal.innerHTML = '';
  });
}

refresh();
frame();
setInterval(() => save(g), 4000);
say('Kernschleife bereit.');
