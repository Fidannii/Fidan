import './style.css';
import { BUILDINGS, RESOURCES, type BuildingKind, type ResourceId } from './game/data';
import { Renderer } from './game/renderer';
import { loadGame, resetGame, saveGame } from './game/save';
import {
  buyFromMarket,
  cityStats,
  collectAt,
  demolish,
  expandCity,
  placeBuilding,
  productionProgress,
  sellToMarket,
  speedUp,
  tick,
  triggerDisaster,
  tryUpgradeHouse,
  type GameState,
} from './game/sim';
import { HOUSE_LEVELS } from './game/data';
import { tileAt } from './game/state';

const hud = document.querySelector<HTMLElement>('#hud')!;
const panel = document.querySelector<HTMLElement>('#panel')!;
const buildBar = document.querySelector<HTMLElement>('#build-bar')!;
const toastEl = document.querySelector<HTMLElement>('#toast')!;
const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
const modalRoot = document.querySelector<HTMLElement>('#modal-root')!;

let state: GameState = loadGame();
const renderer = new Renderer(canvas);
renderer.centerOnMap();

let toastTimer = 0;
function toast(msg: string) {
  toastEl.hidden = false;
  toastEl.textContent = msg;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastEl.hidden = true;
  }, 2200);
}

const BUILD_ORDER: BuildingKind[] = [
  'road',
  'house',
  'woodmill',
  'sawmill',
  'metalmine',
  'workshop',
  'plasticplant',
  'glassworks',
  'textile',
  'furniture',
  'power',
  'water',
  'sewage',
  'waste',
  'police',
  'fire',
  'hospital',
  'park',
  'school',
  'landmark',
];

function renderHud() {
  const { pop, satisfaction, taxPerCycle } = cityStats(state);
  hud.innerHTML = `
    <div class="brand">MetroBuilder</div>
    <div class="stat">💰 ${state.credits} <span>Credits</span></div>
    <div class="stat">💎 ${state.gems} <span>Gems</span></div>
    <div class="stat">👥 ${pop} <span>Einw.</span></div>
    <div class="stat">😊 ${satisfaction}% <span>Zufrieden</span></div>
    <div class="stat">📈 ${taxPerCycle} <span>/Zyklus</span></div>
    <div class="stat">⭐ Lv ${state.playerLevel}</div>
    <div class="stat">🗝️ ${state.keys.bronze}/${state.keys.silver}/${state.keys.gold}</div>
  `;
}

function renderBuildBar() {
  buildBar.innerHTML = BUILD_ORDER.map((id) => {
    const b = BUILDINGS[id];
    const locked = state.playerLevel < b.unlockLevel;
    const active = state.selectedBuild === id;
    return `<button class="build-btn ${active ? 'active' : ''}" data-build="${id}" ${locked ? 'disabled' : ''} title="${b.description}">
      <span class="emoji">${b.emoji}</span>
      <span>${b.name}</span>
      <span class="cost">${locked ? `Lv${b.unlockLevel}` : `${b.cost}¢`}</span>
    </button>`;
  }).join('');
}

function renderPanel() {
  const sel = state.selectedTile ? tileAt(state, state.selectedTile.x, state.selectedTile.y) : null;
  const stats = cityStats(state);
  const inv = Object.entries(RESOURCES)
    .map(
      ([id, meta]) =>
        `<div class="inv-item"><span>${meta.emoji} ${meta.name}</span><strong>${state.inventory[id as ResourceId]}</strong></div>`,
    )
    .join('');

  const quests = state.quests
    .map((q: (typeof state.quests)[number]) => {
      const pct = Math.round((q.progress / q.target) * 100);
      return `<div class="quest ${q.done ? 'done' : ''}">
        <strong>${q.done ? '✓ ' : ''}${q.title}</strong>
        <div class="muted">${q.progress}/${q.target} · +${q.rewardCredits}¢${q.rewardGems ? ` · +${q.rewardGems}💎` : ''}</div>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </div>`;
    })
    .join('');

  let detail = `<p class="muted">Tippe auf die Karte zum Auswählen. Baue Straßen, produziere Rohstoffe, verarbeite sie und upgrade Wohnungen.</p>
    <div class="row">
      <button id="btn-expand" class="primary">🔓 Erweitern (${state.expansionTokens} Token)</button>
      <button id="btn-market">🏪 Markt</button>
      <button id="btn-disaster">🌪️ Katastrophe</button>
      <button id="btn-reset" class="danger">Reset</button>
    </div>
    <h3>Stadt</h3>
    <p class="muted">${stats.houses} Häuser · ${stats.pop} Einwohner · Steuern ${stats.taxPerCycle}¢ / 20s</p>
    <h3>Inventar</h3>
    <div class="inv-grid">${inv}</div>
    <h3>Quests</h3>
    ${quests}`;

  if (sel?.building) {
    const def = BUILDINGS[sel.building.kind];
    const prog = productionProgress(state, sel.x, sel.y);
    const house = sel.building.kind === 'house'
      ? HOUSE_LEVELS[sel.building.level - 1]
      : null;
    const next = sel.building.kind === 'house'
      ? HOUSE_LEVELS.find((h) => h.level === sel.building!.level + 1)
      : null;

    detail = `
      <h2>${def.emoji} ${def.name}</h2>
      <p class="muted">${def.description}</p>
      <p class="muted">Feld ${sel.x},${sel.y}${house ? ` · ${house.name} (L${sel.building.level}) · ${house.pop} Einw.` : ''}</p>
      ${def.produce ? `<div class="progress-ring"><i style="width:${Math.round(prog * 100)}%"></i></div>
        <p class="muted">${sel.building.readyAmount > 0 ? 'Fertig — antippen zum Einsammeln' : sel.building.prodStartedAt ? `Produktion ${Math.round(prog * 100)}%` : 'Wartet auf Zutaten'}</p>` : ''}
      ${sel.building.decay > 10 ? `<p class="muted">⚠️ Abnutzung ${Math.round(sel.building.decay)}% — Versorgung prüfen</p>` : ''}
      <div class="row">
        ${sel.building.readyAmount > 0 ? `<button id="btn-collect" class="primary">Einsammeln</button>` : ''}
        ${def.produce && sel.building.prodStartedAt ? `<button id="btn-speed">⚡ Speed-up (1💎)</button>` : ''}
        ${next ? `<button id="btn-upgrade" class="primary">Upgrade → ${next.name} (${next.cost}¢)</button>` : ''}
        <button id="btn-demo" class="danger">Abreißen</button>
        <button id="btn-deselect" class="ghost">Schließen</button>
      </div>
      ${next ? `<h3>Upgrade braucht</h3><p class="muted">${Object.entries(next.needs).map(([r, n]) => `${RESOURCES[r as ResourceId].emoji}${n}`).join(' · ') || '—'}</p>` : ''}
      <h3>Inventar</h3>
      <div class="inv-grid">${inv}</div>
      <h3>Quests</h3>
      ${quests}
      <div class="row" style="margin-top:0.75rem">
        <button id="btn-expand">🔓 Erweitern</button>
        <button id="btn-market">🏪 Markt</button>
      </div>
    `;
  } else if (sel && !sel.building) {
    detail = `
      <h2>Feld ${sel.x},${sel.y}</h2>
      <p class="muted">Terrain: ${sel.terrain}. Wähle unten ein Gebäude und tippe erneut zum Bauen.</p>
      <div class="row">
        <button id="btn-deselect" class="ghost">Auswahl aufheben</button>
        <button id="btn-expand">🔓 Erweitern</button>
        <button id="btn-market">🏪 Markt</button>
      </div>
      <h3>Inventar</h3>
      <div class="inv-grid">${inv}</div>
      <h3>Quests</h3>
      ${quests}
    `;
  }

  panel.innerHTML = detail;
  wirePanelButtons();
}

function wirePanelButtons() {
  panel.querySelector('#btn-collect')?.addEventListener('click', () => {
    if (!state.selectedTile) return;
    collectAt(state, state.selectedTile.x, state.selectedTile.y, toast);
    refresh();
  });
  panel.querySelector('#btn-speed')?.addEventListener('click', () => {
    if (!state.selectedTile) return;
    speedUp(state, state.selectedTile.x, state.selectedTile.y, toast);
    refresh();
  });
  panel.querySelector('#btn-upgrade')?.addEventListener('click', () => {
    if (!state.selectedTile) return;
    tryUpgradeHouse(state, state.selectedTile.x, state.selectedTile.y, toast);
    refresh();
  });
  panel.querySelector('#btn-demo')?.addEventListener('click', () => {
    if (!state.selectedTile) return;
    demolish(state, state.selectedTile.x, state.selectedTile.y, toast);
    refresh();
  });
  panel.querySelector('#btn-deselect')?.addEventListener('click', () => {
    state.selectedTile = null;
    state.selectedBuild = null;
    refresh();
  });
  panel.querySelector('#btn-expand')?.addEventListener('click', () => {
    expandCity(state, toast);
    refresh();
  });
  panel.querySelector('#btn-market')?.addEventListener('click', openMarket);
  panel.querySelector('#btn-disaster')?.addEventListener('click', () => {
    triggerDisaster(state, toast);
    refresh();
  });
  panel.querySelector('#btn-reset')?.addEventListener('click', () => {
    if (confirm('Spielstand wirklich löschen?')) {
      state = resetGame();
      renderer.centerOnMap();
      toast('Neuer Bürgermeister!');
      refresh();
    }
  });
}

function openMarket() {
  modalRoot.innerHTML = `
    <div class="modal">
      <h2>🏪 Globaler Marktplatz</h2>
      <p class="muted">Kaufen mildert Wartezeiten — Verkaufen bringt Credits. Kernfortschritt bleibt ohne Premium möglich.</p>
      <div class="inv-grid" style="margin-top:0.75rem">
        ${Object.entries(RESOURCES)
          .map(([id, meta]) => {
            const buy = meta.softSell * 3;
            return `<div class="inv-item" style="flex-direction:column;align-items:stretch;gap:0.35rem">
              <div style="display:flex;justify-content:space-between"><span>${meta.emoji} ${meta.name}</span><span>${state.inventory[id as ResourceId]}</span></div>
              <div class="row">
                <button data-buy="${id}">Kauf ${buy}¢</button>
                <button data-sell="${id}">Verkauf ${meta.softSell}¢</button>
              </div>
            </div>`;
          })
          .join('')}
      </div>
      <div class="row" style="margin-top:1rem">
        <button id="close-modal" class="primary">Fertig</button>
      </div>
    </div>`;
  modalRoot.querySelector('#close-modal')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
  });
  modalRoot.querySelectorAll('[data-buy]').forEach((el) => {
    el.addEventListener('click', () => {
      buyFromMarket(state, (el as HTMLElement).dataset.buy as ResourceId, toast);
      openMarket();
      refresh();
    });
  });
  modalRoot.querySelectorAll('[data-sell]').forEach((el) => {
    el.addEventListener('click', () => {
      sellToMarket(state, (el as HTMLElement).dataset.sell as ResourceId, toast);
      openMarket();
      refresh();
    });
  });
}

function refresh() {
  renderHud();
  renderBuildBar();
  renderPanel();
  saveGame(state);
}

buildBar.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-build]');
  if (!btn) return;
  const id = btn.dataset.build as BuildingKind;
  state.selectedBuild = state.selectedBuild === id ? null : id;
  refresh();
});

// Pointer interactions: pan + tap
let dragging = false;
let moved = false;
let lastX = 0;
let lastY = 0;
let pointers = new Map<number, { x: number; y: number }>();
let pinchStartDist = 0;
let pinchStartScale = 1;

function canvasPos(e: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  dragging = true;
  moved = false;
  lastX = e.clientX;
  lastY = e.clientY;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y);
    pinchStartScale = renderer.scale;
  }
});

canvas.addEventListener('pointermove', (e) => {
  const p = canvasPos(e);
  const world = renderer.screenToWorld(p.x, p.y);
  renderer.hover = {
    x: Math.floor(world.x),
    y: Math.floor(world.y),
  };

  if (pointers.has(e.pointerId)) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchStartDist > 0) {
      renderer.scale = Math.min(2.2, Math.max(0.45, pinchStartScale * (dist / pinchStartDist)));
    }
    moved = true;
    return;
  }

  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
  renderer.camX += dx;
  renderer.camY += dy;
  lastX = e.clientX;
  lastY = e.clientY;
});

canvas.addEventListener('pointerup', (e) => {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStartDist = 0;
  if (!dragging) return;
  dragging = false;
  if (moved) return;

  const p = canvasPos(e);
  const world = renderer.screenToWorld(p.x, p.y);
  const x = Math.floor(world.x);
  const y = Math.floor(world.y);
  const tile = tileAt(state, x, y);
  if (!tile) return;

  // Collect ready goods with tap
  if (tile.building?.readyAmount && tile.building.readyAmount > 0 && !state.selectedBuild) {
    collectAt(state, x, y, toast);
    state.selectedTile = { x, y };
    refresh();
    return;
  }

  if (state.selectedBuild) {
    if (placeBuilding(state, x, y, state.selectedBuild, toast)) {
      // keep road selected for painting
      if (state.selectedBuild !== 'road') state.selectedBuild = null;
    }
    state.selectedTile = { x, y };
    refresh();
    return;
  }

  state.selectedTile = { x, y };
  refresh();
});

canvas.addEventListener('pointercancel', (e) => {
  pointers.delete(e.pointerId);
  dragging = false;
});

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const before = renderer.scale;
    renderer.scale = Math.min(2.2, Math.max(0.45, renderer.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
    const p = canvasPos(e as unknown as PointerEvent);
    // zoom toward cursor
    renderer.camX = p.x - ((p.x - renderer.camX) / before) * renderer.scale;
    renderer.camY = p.y - ((p.y - renderer.camY) / before) * renderer.scale;
  },
  { passive: false },
);

function loop() {
  tick(state, toast);
  renderer.draw(state);
  requestAnimationFrame(loop);
}

// Intro once
if (!localStorage.getItem('metrobuilder-intro')) {
  modalRoot.innerHTML = `
    <div class="modal">
      <h2>Willkommen, Bürgermeister</h2>
      <p class="muted">Forme aus einer leeren Fläche eine Metropole. Kernschleife:</p>
      <ol class="muted">
        <li>Rohstoffe produzieren</li>
        <li>Zu Waren verarbeiten</li>
        <li>Gebäude bauen & upgraden</li>
        <li>Zufriedenheit & Steuern steigern</li>
        <li>Neue Flächen freischalten</li>
      </ol>
      <p class="muted">Ziehen = Karte bewegen · Tippen = bauen/sammeln · Pinch/Mausrad = Zoom</p>
      <div class="row"><button id="start-game" class="primary">Stadt gründen</button></div>
    </div>`;
  modalRoot.querySelector('#start-game')?.addEventListener('click', () => {
    localStorage.setItem('metrobuilder-intro', '1');
    modalRoot.innerHTML = '';
  });
}

refresh();
loop();
setInterval(() => saveGame(state), 5000);

toast('MetroBuilder bereit — baue deine Stadt!');
