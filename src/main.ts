import './style.css';
import type { BuildId, Game, RegionId, Res } from './core/types';
import {
  BUILD_ORDER,
  DEFS,
  HOUSE,
  REGIONS,
  RES,
  acceptOffer,
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
  switchRegion,
  tick,
  triggerDisaster,
  unlockRegion,
  upgradeHouse,
  upgradeService,
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
let tab: 'city' | 'market' | 'club' | 'regions' = 'city';

let toastT = 0;
function say(msg: string) {
  toastEl.hidden = false;
  toastEl.textContent = msg;
  clearTimeout(toastT);
  toastT = window.setTimeout(() => {
    toastEl.hidden = true;
  }, 2200);
}

function paintHud() {
  const s = city(g);
  const left = Math.max(0, g.weekEnds - Date.now());
  const m = Math.floor(left / 60000);
  hud.innerHTML = `
    <div class="brand">MetroBuilder</div>
    <div class="stat">${REGIONS[g.region].icon} ${REGIONS[g.region].name}</div>
    <div class="stat">💰 ${g.cash} <span>Credits</span></div>
    <div class="stat">💎 ${g.gems}</div>
    <div class="stat">🗝️ ${g.keys.bronze}/${g.keys.silver}/${g.keys.gold}</div>
    <div class="stat">🎫 ${g.tokens}</div>
    <div class="stat">👥 ${s.pop}</div>
    <div class="stat">😊 ${s.sat}%</div>
    <div class="stat">📈 ${s.tax}<span>/18s</span></div>
    <div class="stat">⭐ Lv ${g.level}</div>
    <div class="stat">🏆 #${g.mayorRank} <span>${m}m</span></div>
  `;
}

function paintBar() {
  bar.innerHTML = BUILD_ORDER.map((id) => {
    const d = DEFS[id];
    const locked = g.level < d.unlockLv;
    return `<button class="build-btn ${g.selected === id ? 'active' : ''}" data-id="${id}" ${locked ? 'disabled' : ''} title="${d.blurb}">
      <span class="emoji">${d.icon}</span>
      <span>${d.name}</span>
      <span class="cost">${locked ? `Lv${d.unlockLv}` : `${d.cost}¢`}</span>
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

function tabsHtml() {
  return `<div class="row">
    <button data-tab="city" class="${tab === 'city' ? 'active' : ''}">Stadt</button>
    <button data-tab="market" class="${tab === 'market' ? 'active' : ''}">Handel</button>
    <button data-tab="club" class="${tab === 'club' ? 'active' : ''}">Club</button>
    <button data-tab="regions" class="${tab === 'regions' ? 'active' : ''}">Regionen</button>
  </div>`;
}

function paintPanel() {
  const f = g.focus ? cell(g, g.focus.x, g.focus.y) : null;
  const s = city(g);

  let body = '';
  if (tab === 'market') {
    body = `
      <h2>🏪 Handel</h2>
      <p class="muted">Marktplatz & Spieler-Angebote (Depot = mehr Offers).</p>
      <div class="inv">${invHtml()}</div>
      <h3>Globaler Markt</h3>
      <div class="inv">
        ${Object.entries(RES)
          .map(([id, m]) => {
            const buyP = m.sell * 4;
            return `<div style="display:flex;flex-direction:column;gap:0.25rem">
              <div style="display:flex;justify-content:space-between"><span>${m.icon} ${m.name}</span><strong>${g.inv[id as Res]}</strong></div>
              <div class="row">
                <button data-buy="${id}">Kauf ${buyP}¢</button>
                <button data-sell="${id}">Verkauf ${m.sell}¢</button>
              </div>
            </div>`;
          })
          .join('')}
      </div>
      <h3>Handelsdepot-Angebote</h3>
      ${
        g.offers.length
          ? g.offers
              .map(
                (o) =>
                  `<div class="quest"><strong>${o.from}</strong>
                    <div class="muted">${o.amount}× ${RES[o.res].icon}${RES[o.res].name} für ${o.price}¢</div>
                    <div class="row"><button data-offer="${o.id}" class="primary">Annehmen</button></div></div>`,
              )
              .join('')
          : '<p class="muted">Warte auf Angebote…</p>'
      }
    `;
  } else if (tab === 'club') {
    const pct = Math.min(100, Math.round((g.club.warScore / g.club.warTarget) * 100));
    body = `
      <h2>👥 ${g.club.name}</h2>
      <p class="muted">Club-Krieg & Bürgermeister-Wettbewerb (lokal simuliert).</p>
      <h3>Mitglieder</h3>
      ${g.club.members
        .slice()
        .sort((a, b) => b.score - a.score)
        .map((m) => `<div class="quest"><strong>${m.name}${m.ai ? '' : ' (Du)'}</strong><div class="muted">Score ${m.score}</div></div>`)
        .join('')}
      <h3>Club-Krieg</h3>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <p class="muted">${g.club.warScore}/${g.club.warTarget} — bauen & sammeln zählt.</p>
      <h3>Bürgermeister</h3>
      <p class="muted">Aktuell Platz #${g.mayorRank} · Wochenpunktzahl ${g.weekScore}</p>
      <div class="row"><button id="a-disaster">🌪️ Katastrophe starten</button></div>
    `;
  } else if (tab === 'regions') {
    body = `
      <h2>🗺️ Regionen</h2>
      <p class="muted">Nebenkarten mit eigenen Boni. Fortschritt (Cash/Inventar/Level) bleibt erhalten.</p>
      ${Object.entries(REGIONS)
        .map(([id, r]) => {
          const unlocked = g.unlockedRegions.includes(id as RegionId);
          const here = g.region === id;
          return `<div class="quest ${here ? '' : ''}">
            <strong>${r.icon} ${r.name}${here ? ' · hier' : ''}</strong>
            <div class="muted">${r.blurb}</div>
            <div class="row">
              ${
                unlocked
                  ? `<button data-goto="${id}" class="${here ? '' : 'primary'}" ${here ? 'disabled' : ''}>Reisen</button>`
                  : `<button data-unlock="${id}" class="primary">Freischalten ${r.unlockCost}¢</button>`
              }
            </div>
          </div>`;
        })
        .join('')}
    `;
  } else if (f?.b) {
    const d = DEFS[f.b.id];
    const p = prog(g, f.x, f.y);
    const next = f.b.id === 'house' ? HOUSE.find((h) => h.level === f.b!.level + 1) : null;
    const tier = f.b.id === 'house' ? HOUSE[f.b.level - 1] : null;
    body = `
      <h2>${d.icon} ${d.name}</h2>
      <p class="muted">${d.blurb}</p>
      <p class="muted">Feld ${f.x},${f.y}${tier ? ` · ${tier.name} · ${tier.pop} Einw.` : ''}${d.radius ? ` · Radius ${d.radius + f.b.level - 1}` : ''}</p>
      ${
        d.produce
          ? `<div class="prog"><i style="width:${Math.round(p * 100)}%"></i></div>
             <p class="muted">${f.b.ready > 0 ? 'Fertig — einsammeln' : f.b.jobAt ? `${Math.round(p * 100)}%` : 'Wartet auf Input'}</p>`
          : ''
      }
      ${f.b.wear > 15 ? `<p class="muted">⚠️ Abnutzung ${Math.round(f.b.wear)}%</p>` : ''}
      <div class="row">
        ${f.b.ready > 0 ? `<button id="a-collect" class="primary">Einsammeln</button>` : ''}
        ${d.produce && f.b.jobAt ? `<button id="a-speed">⚡ Gem</button>` : ''}
        ${next ? `<button id="a-up" class="primary">→ ${next.name} (${next.cost}¢)</button>` : ''}
        ${d.radius && f.b.id !== 'house' ? `<button id="a-svc">Ausbau Radius</button>` : ''}
        <button id="a-demo" class="danger">Abreißen</button>
      </div>
      ${
        next
          ? `<h3>Upgrade</h3><p class="muted">${
              Object.entries(next.needs)
                .map(([r, n]) => `${RES[r as Res].icon}×${n}`)
                .join(' · ') || '—'
            }${next.needSchool ? ' · Schule' : ''}</p>`
          : ''
      }
      <h3>Inventar</h3><div class="inv">${invHtml()}</div>
      <h3>Quests</h3>${questHtml()}
    `;
  } else {
    body = `
      <h2>Metropole</h2>
      <p class="muted">${s.houses} Häuser · ${s.pop} Einw. · Steuern ${s.tax}¢ / 18s
      ${g.disasterUntil && Date.now() < g.disasterUntil ? ' · 🌪️ Sturm aktiv' : ''}</p>
      <div class="row">
        <button id="a-expand" class="primary">🔓 Erweitern (${g.tokens}🎫)</button>
        <button id="a-disaster">🌪️ Katastrophe</button>
        <button id="a-reset" class="danger">Reset</button>
      </div>
      <h3>Inventar</h3><div class="inv">${invHtml()}</div>
      <h3>Quests</h3>${questHtml()}
    `;
  }

  panel.innerHTML = `${tabsHtml()}${body}`;
  wire();
}

function wire() {
  panel.querySelectorAll('[data-tab]').forEach((el) => {
    el.addEventListener('click', () => {
      tab = (el as HTMLElement).dataset.tab as typeof tab;
      paintPanel();
    });
  });
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
  panel.querySelector('#a-svc')?.addEventListener('click', () => {
    if (!g.focus) return;
    upgradeService(g, g.focus.x, g.focus.y, say);
    refresh();
  });
  panel.querySelector('#a-demo')?.addEventListener('click', () => {
    if (!g.focus) return;
    demolish(g, g.focus.x, g.focus.y, say);
    refresh();
  });
  panel.querySelector('#a-expand')?.addEventListener('click', () => {
    expand(g, say);
    refresh();
  });
  panel.querySelector('#a-disaster')?.addEventListener('click', () => {
    triggerDisaster(g, say);
    refresh();
  });
  panel.querySelector('#a-reset')?.addEventListener('click', () => {
    if (confirm('Alles zurücksetzen?')) {
      g = reset();
      view.center(g);
      tab = 'city';
      say('Neustart.');
      refresh();
    }
  });
  panel.querySelectorAll('[data-buy]').forEach((el) => {
    el.addEventListener('click', () => {
      buy(g, (el as HTMLElement).dataset.buy as Res, say);
      refresh();
    });
  });
  panel.querySelectorAll('[data-sell]').forEach((el) => {
    el.addEventListener('click', () => {
      sell(g, (el as HTMLElement).dataset.sell as Res, say);
      refresh();
    });
  });
  panel.querySelectorAll('[data-offer]').forEach((el) => {
    el.addEventListener('click', () => {
      acceptOffer(g, (el as HTMLElement).dataset.offer!, say);
      refresh();
    });
  });
  panel.querySelectorAll('[data-unlock]').forEach((el) => {
    el.addEventListener('click', () => {
      unlockRegion(g, (el as HTMLElement).dataset.unlock as RegionId, say);
      refresh();
    });
  });
  panel.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => {
      const next = switchRegion(g, (el as HTMLElement).dataset.goto as RegionId, say);
      if (next) {
        g = next;
        view.center(g);
        refresh();
      }
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
  const el = (e.target as HTMLElement).closest('[data-id]');
  if (!(el instanceof HTMLButtonElement) || el.disabled) return;
  const id = el.dataset.id as BuildId;
  g.selected = g.selected === id ? null : id;
  tab = 'city';
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
    if (pinch0 > 0) view.scale = Math.min(2.4, Math.max(0.45, scale0 * (d / pinch0)));
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
    tab = 'city';
    refresh();
    return;
  }
  if (g.selected) {
    place(g, x, y, g.selected, say);
    if (g.selected !== 'road' && g.selected !== 'highway') g.selected = null;
    g.focus = { x, y };
    tab = 'city';
    refresh();
    return;
  }
  g.focus = { x, y };
  tab = 'city';
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
    view.scale = Math.min(2.4, Math.max(0.45, view.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
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

if (!localStorage.getItem('metrobuilder-full-intro')) {
  modal.innerHTML = `
    <div class="modal">
      <h2>MetroBuilder — Vollversion</h2>
      <p class="muted">Alles aus dem GDD im lokalen Prototyp:</p>
      <ol class="loop">
        <li>Produktionsketten & Infrastruktur</li>
        <li>Dienste, Spezialzonen, Wahrzeichen</li>
        <li>Handel, Depot-Angebote, Regionen</li>
        <li>Club-Krieg, Bürgermeister-Wettbewerb, Katastrophen</li>
      </ol>
      <div class="row" style="margin-top:0.9rem"><button id="go" class="primary">Los</button></div>
    </div>`;
  modal.querySelector('#go')?.addEventListener('click', () => {
    localStorage.setItem('metrobuilder-full-intro', '1');
    modal.innerHTML = '';
  });
}

refresh();
frame();
setInterval(() => save(g), 4000);
say('Vollversion bereit.');
