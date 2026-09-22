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
  buyNextLevel,
  buyXpPack,
  cell,
  collect,
  expand,
  grantIap,
  loadWithMeta,
  prog,
  reset,
  save,
  sell,
  speedUp,
  tick,
  triggerDisaster,
  unlockRegion,
  upgradeService,
  cityStats,
  tradeToRegion,
  canPlace,
} from './core/sim';
import { landValueAt } from './core/systems';
import { computeTraffic } from './core/traffic';
import {
  SPECS,
  cityTierOf,
  ensureProgression,
  strategicGoals,
  type SpecId,
} from './core/cityProgress';
import { ensureEvents, eventHint } from './core/events';
import { ensureCities } from './core/cities';
import { ensureRuntime, type GameSpeed } from './core/clock';
import { busLinesSummary, ensureBus, cmdCreateBusLine } from './core/bus';
import {
  cmdBuildBuilding,
  cmdDemolish,
  cmdUpgradeBuilding,
  cmdSetTaxRate,
  cmdSetGameSpeed,
  cmdAcceptEventChoice,
  cmdSetSpecialization,
  cmdSwitchCity,
} from './game/commands';
import {
  MAX_LEVEL,
  buyLevelCost,
  difficulty,
  nextMilestones,
  nextUnlocks,
  scaledCost,
  xpPacks,
  xpProgress,
} from './core/progression';
import type { LevelUpEvent } from './core/progression';
import { initIap, listIapOffers, purchaseIap, restoreIap, getIapStatus, getActiveStore, storeLabel } from './iap/iap';
import type { IapSku } from './iap/catalog';
import {
  ACHIEVEMENTS,
  TUTORIAL,
  canClaimDaily,
  claimDaily,
  ensureMeta,
} from './core/meta';
import {
  getAudioSettings,
  setAudioSettings,
  sfxBuy,
  sfxClick,
  sfxCollect,
  sfxDisaster,
  sfxError,
  sfxExpand,
  sfxLevelUp,
  sfxPlace,
  sfxUpgrade,
  unlockAudio,
} from './audio/sfx';
import { View } from './render/view';
import { avatarCard, avatarUrl } from './ui/avatars';
import { Capacitor } from '@capacitor/core';

async function initNative() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#050d12' });
  } catch {
    /* web */
  }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    /* optional */
  }
}

void initNative();

async function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!getAudioSettings().haptics) return;
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] });
  } catch {
    /* optional */
  }
}

function mayorTitle(level: number): string {
  if (level >= 100) return 'Legende der 100';
  if (level >= 90) return 'Weltarchitekt';
  if (level >= 80) return 'Weltstadt-Mayor';
  if (level >= 70) return 'Kontinent-Planer';
  if (level >= 60) return 'Mega-Mayor';
  if (level >= 50) return 'Metropol-Legende';
  if (level >= 40) return 'Handelsfürst';
  if (level >= 30) return 'Großstadt-Ikone';
  if (level >= 20) return 'Stadtvisionär';
  if (level >= 10) return 'Stadtrat';
  if (level >= 5) return 'Jungbürgermeister';
  return 'Siedler';
}

function diffClass(tier: string): string {
  return `diff-${tier}`;
}

function satTone(sat: number): string {
  if (sat >= 80) return 'sat-great';
  if (sat >= 55) return 'sat-ok';
  if (sat >= 30) return 'sat-meh';
  return 'sat-bad';
}

const hud = document.querySelector<HTMLElement>('#hud')!;
const panel = document.querySelector<HTMLElement>('#panel')!;
const bar = document.querySelector<HTMLElement>('#build-bar')!;
const toastEl = document.querySelector<HTMLElement>('#toast')!;
const modal = document.querySelector<HTMLElement>('#modal-root')!;
const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;

const loaded = loadWithMeta();
let g: Game = loaded.game;
ensureMeta(g);
ensureProgression(g);
ensureEvents(g);
ensureCities(g);
ensureBus(g);
ensureRuntime(g);
const view = new View(canvas);
view.center(g);
let tab: 'city' | 'market' | 'club' | 'regions' | 'level' | 'more' = 'city';
let levelModalOpen = false;

let toastT = 0;
function say(msg: string) {
  toastEl.hidden = false;
  toastEl.textContent = msg;
  clearTimeout(toastT);
  toastT = window.setTimeout(() => {
    toastEl.hidden = true;
  }, 2200);
}

if (loaded.userMessage) {
  say(loaded.userMessage);
} else if (loaded.recovered) {
  say(`Spielstand wiederhergestellt (${loaded.source}).`);
} else if (loaded.source === 'legacy') {
  say('Spielstand migriert.');
}

function advanceTutorial(to?: number) {
  ensureMeta(g);
  if (g.tutorialStep < 0 || g.tutorialStep >= TUTORIAL.length) return;
  g.tutorialStep = to != null ? to : g.tutorialStep + 1;
  save(g);
  paintTutorial();
}

function paintTutorial() {
  ensureMeta(g);
  let tip = document.querySelector<HTMLElement>('#tutorial-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'tutorial-tip';
    document.querySelector('#stage-wrap')?.appendChild(tip);
  }
  if (g.tutorialStep < 0 || g.tutorialStep >= TUTORIAL.length) {
    tip.hidden = true;
    tip.innerHTML = '';
    return;
  }
  const step = TUTORIAL[g.tutorialStep];
  tip.hidden = false;
  tip.innerHTML = `
    <div class="tut-card">
      <strong>${step.title}</strong>
      <p>${step.body}</p>
      <div class="row">
        <button id="tut-next" class="primary">${g.tutorialStep >= TUTORIAL.length - 1 ? 'Los geht’s' : 'Weiter'}</button>
        <button id="tut-skip" class="ghost">Überspringen</button>
      </div>
      <div class="tut-progress">${g.tutorialStep + 1}/${TUTORIAL.length}</div>
    </div>`;
  tip.querySelector('#tut-next')?.addEventListener('click', () => {
    sfxClick();
    if (g.tutorialStep >= TUTORIAL.length - 1) {
      g.tutorialStep = TUTORIAL.length;
      save(g);
      paintTutorial();
    } else advanceTutorial();
  });
  tip.querySelector('#tut-skip')?.addEventListener('click', () => {
    g.tutorialStep = -1;
    save(g);
    paintTutorial();
  });
}

function paintHud() {
  const s = cityStats(g);
  const xp = xpProgress(g);
  const net = s.cashflow.net;
  const dem =
    s.demand.residential > 8 ? 'Wohnen+' : s.demand.industrial > 8 ? 'Industrie+' : s.demand.commercial > 8 ? 'Gewerbe+' : 'stabil';
  hud.innerHTML = `
    <div class="hud-player">
      <img class="hud-avatar" src="${avatarUrl('player')}" alt="Du" width="64" height="64" />
      <div>
        <div class="brand">MetroBuilder</div>
        <div class="mayor-title">${mayorTitle(g.level)} · Lv ${g.level}</div>
        <div class="xp-wrap" title="${xp.cur}/${xp.need} XP">
          <div class="xp-bar"><i style="width:${xp.pct}%"></i></div>
        </div>
      </div>
    </div>
    <div class="stat hud-primary pulse-gold">💰 ${g.cash}</div>
    <div class="stat hud-primary">👥 ${s.pop}</div>
    <div class="stat hud-primary ${satTone(s.sat)}">😊 ${s.sat}%</div>
    <div class="stat hud-primary" title="Nachfrage">📶 ${dem}</div>
    <div class="stat ${net >= 0 ? 'sat-ok' : 'sat-bad'}">${net >= 0 ? '+' : ''}${net}<span>/Tick</span></div>
    <div class="stat hud-secondary">${REGIONS[g.region].icon} ${REGIONS[g.region].name}</div>
    <div class="stat hud-secondary">💎 ${g.gems}</div>
    <div class="stat hud-secondary">🏠 ${s.jobs} Jobs</div>
  `;
}

function paintBar() {
  bar.innerHTML = BUILD_ORDER.map((id) => {
    const d = DEFS[id];
    const locked = g.level < d.unlockLv;
    const price = scaledCost(d.cost, g.level);
    return `<button class="build-btn ${g.selected === id ? 'active' : ''}" data-id="${id}" ${locked ? 'disabled' : ''} title="${d.blurb}">
      <span class="emoji">${d.icon}</span>
      <span>${d.name}</span>
      <span class="cost">${locked ? `Lv${d.unlockLv}` : `${price}¢`}</span>
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
  return `<div class="tabs">
    <button data-tab="city" class="${tab === 'city' ? 'active' : ''}"><span>🏙️</span> Stadt</button>
    <button data-tab="level" class="${tab === 'level' ? 'active' : ''}"><span>⭐</span> Aufstieg</button>
    <button data-tab="market" class="${tab === 'market' ? 'active' : ''}"><span>🏪</span> Handel</button>
    <button data-tab="club" class="${tab === 'club' ? 'active' : ''}"><span>👥</span> Club</button>
    <button data-tab="regions" class="${tab === 'regions' ? 'active' : ''}"><span>🗺️</span> Regionen</button>
    <button data-tab="more" class="${tab === 'more' ? 'active' : ''}"><span>⚙️</span> Mehr</button>
  </div>`;
}

function paintPanel() {
  const f = g.focus ? cell(g, g.focus.x, g.focus.y) : null;
  g.lastSimAt = 0;
  const s = cityStats(g);

  let body = '';
  if (tab === 'level') {
    const xp = xpProgress(g);
    const upcoming = nextUnlocks(g, 6);
    const miles = nextMilestones(g, 4);
    const unlocked = BUILD_ORDER.filter((id) => DEFS[id].unlockLv <= g.level);
    const diff = difficulty(g.level);
    body = `
      <h2>⭐ Level-Aufstieg</h2>
      <p class="muted">Titel: <strong>${mayorTitle(g.level)}</strong> — Ziel Level ${MAX_LEVEL}.</p>
      <div class="level-card">
        <div class="level-badge">Lv ${g.level}</div>
        <div class="level-xp">
          <strong>${xp.cur} / ${xp.need} XP</strong>
          <div class="xp-bar lg"><i style="width:${xp.pct}%"></i></div>
          <p class="muted">${g.level >= MAX_LEVEL ? 'Maximallevel 100 erreicht!' : `${xp.need - xp.cur} XP bis Level ${g.level + 1}`}</p>
        </div>
      </div>
      <div class="diff-card ${diffClass(diff.tier)}">
        <div class="diff-head">Schwierigkeit · ${diff.label}</div>
        <p class="muted">${diff.blurb}</p>
        <div class="diff-stats">
          <span>Produktion ×${diff.prod.toFixed(2)}</span>
          <span>Kosten ×${diff.cost.toFixed(2)}</span>
          <span>Verschleiß ×${diff.wear.toFixed(2)}</span>
        </div>
      </div>
      ${
        g.level >= MAX_LEVEL
          ? ''
          : (() => {
              const packs = xpPacks(g);
              const lvlCost = buyLevelCost(g);
              const remain = xp.need - xp.cur;
              const iap = listIapOffers();
              const store = getActiveStore();
              const iapNote =
                getIapStatus() === 'ready'
                  ? store === 'apple'
                    ? 'Zahlung über Apple App Store (Apple-ID / iCloud-Konto).'
                    : store === 'google'
                      ? 'Zahlung über Google Play Billing.'
                      : 'Web-Demo (kein Echtgeld). Auf dem Handy: Apple App Store oder Google Play.'
                  : getIapStatus() === 'loading'
                    ? `${storeLabel(store)} wird verbunden…`
                    : `${storeLabel(store)} nicht bereit — Produkte in der Console prüfen.`;
              return `
      <h3>Echtgeld · ${storeLabel(store)}</h3>
      <p class="muted">${iapNote}</p>
      <div class="shop-grid iap-grid">
        ${iap
          .map(
            (o) => `<button data-iap="${o.id}" class="shop-btn iap-btn" ${g.level >= MAX_LEVEL || getIapStatus() === 'loading' ? 'disabled' : ''}>
              <strong>${o.title}</strong>
              <span class="muted">${o.blurb}</span>
              <span class="cost euro">${o.price}</span>
            </button>`,
          )
          .join('')}
      </div>
      <div class="row"><button id="a-iap-restore" class="ghost">Käufe wiederherstellen (${store === 'apple' ? 'Apple-ID' : store === 'google' ? 'Google' : 'Store'})</button></div>
      <h3>Mit Credits (Soft)</h3>
      <p class="muted">XP oder Level auch mit 💰 Spiel-Credits.</p>
      <div class="shop-grid">
        ${packs
          .map(
            (p) => `<button data-xp-pack="${p.id}" class="shop-btn" ${g.cash < p.cost ? 'disabled' : ''}>
              <strong>${p.label}</strong>
              <span class="cost">${p.cost}¢</span>
            </button>`,
          )
          .join('')}
        ${
          lvlCost != null
            ? `<button id="a-buy-level" class="shop-btn primary" ${g.cash < lvlCost ? 'disabled' : ''}>
                <strong>Level ${g.level + 1} (Credits)</strong>
                <span class="muted">${remain} XP fehlen</span>
                <span class="cost">${lvlCost}¢</span>
              </button>`
            : ''
        }
      </div>`;
            })()
      }
      <h3>XP verdienen</h3>
      <ul class="loop">
        <li>Gebäude bauen · +10 XP</li>
        <li>Ressourcen sammeln · +8 XP</li>
        <li>Haus-Upgrade · +28–52 XP</li>
        <li>Service-Ausbau · +16 XP</li>
        <li>Stadt erweitern · +35 XP</li>
      </ul>
      <h3>Nächste Freischaltungen</h3>
      ${
        upcoming.length
          ? upcoming
              .map(
                (u) => `<div class="quest">
                  <strong>Level ${u.level}</strong>
                  <div class="muted">${u.ids.map((id) => `${DEFS[id].icon} ${DEFS[id].name}`).join(' · ')}</div>
                </div>`,
              )
              .join('')
          : '<p class="muted">Alle Gebäude freigeschaltet.</p>'
      }
      <h3>Meilensteine</h3>
      ${
        miles.length
          ? miles
              .map((m) => `<div class="quest"><strong>Lv ${m.level}</strong><div class="muted">${m.title}</div></div>`)
              .join('')
          : '<p class="muted">Alle Meilensteine erreicht.</p>'
      }
      <h3>Freigeschaltet (${unlocked.length}/${BUILD_ORDER.length})</h3>
      <div class="unlock-chips">
        ${unlocked.map((id) => `<span class="chip">${DEFS[id].icon} ${DEFS[id].name}</span>`).join('')}
      </div>
    `;
  } else if (tab === 'market') {
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
                  `<div class="quest offer-row">
                    ${avatarCard(o.avatar, { name: o.from, subtitle: 'Händler', size: 'sm' })}
                    <div class="offer-body">
                      <strong>${o.amount}× ${RES[o.res].icon} ${RES[o.res].name}</strong>
                      <div class="muted">${o.price}¢</div>
                      <div class="row"><button data-offer="${o.id}" class="primary">Annehmen</button></div>
                    </div>
                  </div>`,
              )
              .join('')
          : '<p class="muted">Warte auf Angebote…</p>'
      }
    `;
  } else if (tab === 'club') {
    const pct = Math.min(100, Math.round((g.club.warScore / g.club.warTarget) * 100));
    const ranked = g.club.members.slice().sort((a, b) => b.score - a.score);
    body = `
      <h2>👥 ${g.club.name}</h2>
      <p class="muted">Club-Krieg & Bürgermeister-Wettbewerb — Avatare in Maximalqualität.</p>
      <div class="avatar-hero">
        ${avatarCard('player', {
          name: 'Bürgermeister',
          subtitle: `Platz #${g.mayorRank} · ${g.weekScore} WP`,
          size: 'lg',
          you: true,
        })}
      </div>
      <h3>Mitglieder</h3>
      <div class="avatar-grid">
        ${ranked
          .map((m, i) =>
            avatarCard(m.avatar, {
              name: m.name,
              subtitle: m.ai ? 'Club-Mitglied' : 'Bürgermeister',
              size: 'md',
              rank: i + 1,
              score: m.score,
              you: !m.ai,
            }),
          )
          .join('')}
      </div>
      <h3>Club-Krieg</h3>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <p class="muted">${g.club.warScore}/${g.club.warTarget} — bauen & sammeln zählt.</p>
      <div class="row"><button id="a-disaster">🌪️ Katastrophe starten</button></div>
    `;
  } else if (tab === 'regions') {
    ensureCities(g);
    const others = g.unlockedRegions.filter((id) => id !== g.region);
    body = `
      <h2>🗺️ Regionen & Städte</h2>
      <p class="muted">Jede Region speichert ihre eigene Stadt. Shared: Credits, Level, Erfolge.</p>
      ${Object.entries(REGIONS)
        .map(([id, r]) => {
          const unlocked = g.unlockedRegions.includes(id as RegionId);
          const here = g.region === id;
          const saved = !!g.cities?.[id as RegionId];
          return `<div class="quest">
            <strong>${r.icon} ${r.name}${here ? ' · hier' : ''}${saved && !here ? ' · gespeichert' : ''}</strong>
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
      <h3>Regionalhandel</h3>
      <p class="muted">1× Holz in eine andere Stadt schicken (Transportgebühr).</p>
      <div class="row">
        ${others
          .map(
            (id) =>
              `<button data-trade="${id}" class="primary" ${g.inv.wood < 1 ? 'disabled' : ''}>🪵→ ${REGIONS[id].name}</button>`,
          )
          .join('') || '<span class="muted">Weitere Regionen freischalten.</span>'}
      </div>
    `;
  } else if (tab === 'more') {
    ensureMeta(g);
    const audio = getAudioSettings();
    const unlockedAch = ACHIEVEMENTS.filter((a) => g.achievements[a.id]);
    body = `
      <h2>⚙️ Mehr</h2>
      <p class="muted">MetroBuilder 3.0-Candidate — Daily, Erfolge, Cloud-Stub & Hilfe.</p>
      <h3>Daily-Bonus</h3>
      <p class="muted">Serie: ${g.dailyStreak} Tag(e)${g.level >= MAX_LEVEL ? ` · Meisterschaft ${g.mastery}` : ''}</p>
      <div class="row">
        <button id="a-daily" class="primary" ${canClaimDaily(g) ? '' : 'disabled'}>
          ${canClaimDaily(g) ? '🎁 Daily abholen' : '✓ Heute erledigt'}
        </button>
      </div>
      <h3>Erfolge (${unlockedAch.length}/${ACHIEVEMENTS.length})</h3>
      <div class="ach-grid">
        ${ACHIEVEMENTS.map((a) => {
          const ok = !!g.achievements[a.id];
          return `<div class="ach ${ok ? 'done' : ''}">
            <span class="ach-icon">${a.icon}</span>
            <div>
              <strong>${a.title}</strong>
              <div class="muted">${a.blurb}${ok ? '' : ` · +${a.rewardCash}¢`}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <h3>Cloud-Save vorbereitet (Stub)</h3>
      <p class="muted">Kein echter Cloud-Sync — nur lokaler Marker. Lokal bleibt führend.</p>
      <div class="row"><button id="a-cloud">☁️ Sync markieren</button></div>
      <p class="muted">${g.cloudSyncAt ? `Letzter lokaler Marker: ${new Date(g.cloudSyncAt).toLocaleString('de')}` : 'Noch nie markiert.'}</p>
      <h3>Audio &amp; Feedback</h3>
      <div class="row">
        <button id="a-sfx" class="${audio.sfx ? 'active' : ''}">SFX ${audio.sfx ? 'An' : 'Aus'}</button>
        <button id="a-music" class="${audio.music ? 'active' : ''}">Musik ${audio.music ? 'An' : 'Aus'}</button>
        <button id="a-haptic" class="${audio.haptics ? 'active' : ''}">Haptik ${audio.haptics ? 'An' : 'Aus'}</button>
      </div>
      <h3>Hilfe</h3>
      <ul class="loop">
        <li>Cashflow = Steuern + Gewerbe − Unterhalt</li>
        <li>Kapazität der Dienste zählt, nicht nur Radius</li>
        <li>Spezialisierung & Stadtstatus für Langzeitziele</li>
        <li>Jede Region = eigene gespeicherte Stadt</li>
      </ul>
      <div class="row">
        <button id="a-retut">Tutorial neu starten</button>
        <a class="privacy-link" href="./privacy.html" target="_blank" rel="noopener">Datenschutz</a>
      </div>
    `;
  } else if (f?.b) {
    const d = DEFS[f.b.id];
    const p = prog(g, f.x, f.y);
    const next = f.b.id === 'house' ? HOUSE.find((h) => h.level === f.b!.level + 1) : null;
    const tier = f.b.id === 'house' ? HOUSE[f.b.level - 1] : null;
    const upNeedLv = next ? (next.level === 5 ? 40 : next.level === 6 ? 70 : 0) : 0;
    const upPrice = next ? scaledCost(next.cost, g.level) : 0;
    body = `
      <h2>${d.icon} ${d.name}</h2>
      <p class="muted">${d.blurb}</p>
      <p class="muted">Feld ${f.x},${f.y}${tier ? ` · ${tier.name} · ${tier.pop} Einw.` : ''}${d.radius ? ` · Radius ${d.radius + f.b.level - 1}` : ''} · Wert ${landValueAt(g, f.x, f.y)}</p>
      ${
        f.b.id === 'house'
          ? `<p class="muted">Zufriedenheit Stadt ${s.sat}% · Jobs ${s.jobs} · Nachfrage Wohnen ${s.demand.residential > 0 ? '+' : ''}${s.demand.residential}</p>`
          : ''
      }
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
        ${
          next
            ? `<button id="a-up" class="primary" ${g.level < upNeedLv ? 'disabled' : ''}>→ ${next.name} (${upPrice}¢${upNeedLv ? ` · Lv${upNeedLv}` : ''})</button>`
            : ''
        }
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
    const cf = s.cashflow;
    const causesHtml = s.causes.length
      ? `<ul class="cause-list">${s.causes
          .map(
            (c) =>
              `<li><span>${c.label}</span><strong class="${c.delta >= 0 ? 'pos' : 'neg'}">${c.delta > 0 ? '+' : ''}${c.delta}</strong></li>`,
          )
          .join('')}</ul>`
      : `<p class="muted">Noch keine Häuser — baue Wohnraum.</p>`;
    const svcHtml = s.services
      .filter((svc) => svc.capacity > 0 || s.pop > 0)
      .slice(0, 6)
      .map(
        (svc) => {
          const missing = svc.capacity <= 0 && svc.demand > 0;
          const label = missing ? 'fehlt' : `${Math.min(999, svc.load)}%`;
          const width = missing ? 100 : Math.min(100, svc.load);
          return `<div class="svc-row"><span>${svc.label}</span><div class="bar thin ${missing ? 'warn' : ''}"><i style="width:${width}%"></i></div><span class="muted">${label}</span></div>`;
        },
      )
      .join('');
    body = `
      <h2>Metropole</h2>
      <p class="muted">${s.houses} Häuser · ${s.pop} Einw. · ${s.jobs} Jobs · Arbeitslosigkeit ${s.unemployment}%
      ${g.disasterUntil && Date.now() < g.disasterUntil ? ' · 🌪️ Sturm aktiv' : ''}</p>
      <div class="cashflow-card">
        <div class="cashflow-net ${cf.net >= 0 ? 'pos' : 'neg'}">${cf.net >= 0 ? '+' : ''}${cf.net}¢ <span>/ Periode</span></div>
        <div class="cashflow-grid">
          <span>Steuern +${cf.taxes}</span>
          <span>Gewerbe +${cf.commerce}</span>
          <span>Industrie +${cf.industry}</span>
          <span>Straßen −${cf.roads ?? 0}</span>
          <span>Services −${cf.services}</span>
          <span>Transport −${cf.transport ?? 0}</span>
          <span>Gebäude −${cf.maintenance}</span>
        </div>
        <p class="muted">Steuersatz ${Math.round((g.taxRate ?? 1) * 100)}% · Tempo ${g.gameSpeed || '1x'} · Graph ${g.trafficGraph?.edgeCount ?? 0} Kanten</p>
        <div class="row">
          <button data-tax="0.8">Steuer 80%</button>
          <button data-tax="1" class="${(g.taxRate ?? 1) === 1 ? 'active' : ''}">100%</button>
          <button data-tax="1.2">120%</button>
          <button data-speed="pause">⏸</button>
          <button data-speed="1x" class="${(g.gameSpeed || '1x') === '1x' ? 'active' : ''}">1×</button>
          <button data-speed="2x">2×</button>
          <button data-speed="4x">4×</button>
        </div>
      </div>
      <div class="sat-meter ${satTone(s.sat)}">
        <div class="sat-label">Zufriedenheit · Grundstück Ø ${s.landAvg}</div>
        <div class="bar"><i style="width:${s.sat}%"></i></div>
        ${causesHtml}
      </div>
      <h3>Nachfrage</h3>
      <p class="muted">Wohnen ${s.demand.residential > 0 ? '+' : ''}${s.demand.residential} · Gewerbe ${s.demand.commercial > 0 ? '+' : ''}${s.demand.commercial} · Industrie ${s.demand.industrial > 0 ? '+' : ''}${s.demand.industrial}</p>
      <h3>Versorgung (Auslastung)</h3>
      <div class="svc-list">${svcHtml || '<p class="muted">Keine Dienste gebaut.</p>'}</div>
      <div class="row">
        <button id="a-expand" class="primary">🔓 Erweitern (${g.tokens}🎫)</button>
        <button id="a-overlay-land" class="${view.overlay === 'land' ? 'active' : ''}">🗺 Wert</button>
        <button id="a-overlay-traffic" class="${view.overlay === 'traffic' ? 'active' : ''}">🚗 Stau</button>
        <button id="a-overlay-power" class="${view.overlay === 'power' ? 'active' : ''}">⚡ Strom</button>
        <button id="a-overlay-health" class="${view.overlay === 'health' ? 'active' : ''}">✚ Klinik</button>
        <button id="a-disaster">🌪️ Katastrophe</button>
        <button id="a-reset" class="danger">Reset</button>
        <a class="privacy-link" href="./privacy.html" target="_blank" rel="noopener">Datenschutz</a>
      </div>
      ${
        g.activeEvent
          ? `<div class="event-card"><strong>${g.activeEvent.title}</strong><p class="muted">${g.activeEvent.body}</p>
            <div class="row">
              <button id="a-ev-invest" class="primary">${g.activeEvent.investLabel}</button>
              <button id="a-ev-ignore">${g.activeEvent.ignoreLabel}</button>
            </div></div>`
          : eventHint(g)
            ? `<p class="muted">💡 ${eventHint(g)}</p>`
            : ''
      }
      <h3>Stadtstatus & Spezialisierung</h3>
      ${(() => {
        const tier = cityTierOf(g);
        const goals = strategicGoals(
          g,
          s.sat,
          s.services.find((x) => x.kind === 'health')?.load ?? 999,
        );
        const tr = g.traffic ?? computeTraffic(g);
        return `<p class="muted">${tier.name}${tier.next ? ` → ${tier.next} (${tier.progress}%)` : ' · MAX'} · Spec: ${SPECS.find((x) => x.id === (g.specialization || 'none'))?.name}</p>
        <p class="muted">🚗 Stau ${tr.congestion}%${g.trafficGraph ? ` · ${g.trafficGraph.edgeCount} Straßenkanten` : ''}${tr.congestion > 55 ? ' — Mehr Kapazität (Highway/Bus) entlastet Pendler.' : ''}</p>
        <div class="row">${SPECS.map((sp) => `<button data-spec="${sp.id}" class="${g.specialization === sp.id ? 'active' : ''}" title="${sp.blurb}">${sp.icon} ${sp.name}</button>`).join('')}</div>
        <ul class="cause-list">${goals.map((gl) => `<li><span>${gl.done ? '✓' : '○'} ${gl.title}</span><strong class="${gl.done ? 'pos' : ''}">${gl.blurb}</strong></li>`).join('')}</ul>`;
      })()}
      <h3>Buslinien</h3>
      <p class="muted">Baue Depot + Stationen, dann Linie anlegen. Betrieb kostet Credits, entlastet Straßen.</p>
      <pre class="muted" style="white-space:pre-wrap;font-size:0.8rem">${busLinesSummary(g)}</pre>
      <div class="row"><button id="a-bus-auto" class="primary">Buslinie aus Haltestellen</button></div>
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
      sfxClick();
      tab = (el as HTMLElement).dataset.tab as typeof tab;
      paintPanel();
    });
  });
  panel.querySelector('#a-daily')?.addEventListener('click', () => {
    if (claimDaily(g, say)) {
      sfxBuy();
      void haptic('medium');
    } else sfxError();
    refresh();
  });
  panel.querySelector('#a-sfx')?.addEventListener('click', () => {
    const cur = getAudioSettings();
    setAudioSettings({ sfx: !cur.sfx });
    sfxClick();
    paintPanel();
  });
  panel.querySelector('#a-music')?.addEventListener('click', () => {
    const cur = getAudioSettings();
    setAudioSettings({ music: !cur.music });
    unlockAudio();
    paintPanel();
  });
  panel.querySelector('#a-haptic')?.addEventListener('click', () => {
    const cur = getAudioSettings();
    setAudioSettings({ haptics: !cur.haptics });
    sfxClick();
    paintPanel();
  });
  panel.querySelector('#a-retut')?.addEventListener('click', () => {
    g.tutorialStep = 0;
    save(g);
    paintTutorial();
    say('Tutorial gestartet.');
  });
  panel.querySelector('#a-collect')?.addEventListener('click', () => {
    if (!g.focus) return;
    if (collect(g, g.focus.x, g.focus.y, say)) {
      view.spawnBurst(g.focus.x, g.focus.y, '#ffe566', 16);
      view.floatAt(g.focus.x, g.focus.y, '+Ressourcen', '#ffe566');
      sfxCollect();
      void haptic('medium');
    }
    refresh();
  });
  panel.querySelector('#a-speed')?.addEventListener('click', () => {
    if (!g.focus) return;
    speedUp(g, g.focus.x, g.focus.y, say);
    sfxBuy();
    refresh();
  });
  panel.querySelector('#a-up')?.addEventListener('click', () => {
    if (!g.focus) return;
    const r = cmdUpgradeBuilding(g, g.focus.x, g.focus.y, say);
    if (r.ok) {
      view.spawnBurst(g.focus.x, g.focus.y, '#7ad4ff', 18);
      view.floatAt(g.focus.x, g.focus.y, 'Upgrade!', '#7ad4ff');
      sfxUpgrade();
      void haptic('heavy');
    } else sfxError();
    refresh();
  });
  panel.querySelector('#a-svc')?.addEventListener('click', () => {
    if (!g.focus) return;
    upgradeService(g, g.focus.x, g.focus.y, say);
    refresh();
  });
  panel.querySelector('#a-demo')?.addEventListener('click', () => {
    if (!g.focus) return;
    const c = cell(g, g.focus.x, g.focus.y);
    if (!c?.b) {
      say('Nichts da.');
      return;
    }
    const important = !['road', 'highway'].includes(c.b.id);
    if (important) {
      const name = DEFS[c.b.id].name;
      modal.innerHTML = `
        <div class="modal">
          <h2>Abriss?</h2>
          <p class="muted">${name} entfernen? Du erhältst einen Teil der Baukosten zurück.</p>
          <div class="row">
            <button id="demo-yes" class="danger">Abriss bestätigen</button>
            <button id="demo-no">Abbrechen</button>
          </div>
        </div>`;
      modal.querySelector('#demo-yes')?.addEventListener('click', () => {
        modal.innerHTML = '';
        cmdDemolish(g, g.focus!.x, g.focus!.y, say);
        sfxClick();
        refresh();
      });
      modal.querySelector('#demo-no')?.addEventListener('click', () => {
        modal.innerHTML = '';
        sfxClick();
      });
      return;
    }
    cmdDemolish(g, g.focus.x, g.focus.y, say);
    refresh();
  });
  panel.querySelector('#a-expand')?.addEventListener('click', () => {
    if (expand(g, say)) sfxExpand();
    else sfxError();
    refresh();
  });
  panel.querySelectorAll('[data-tax]').forEach((el) => {
    el.addEventListener('click', () => {
      const v = Number((el as HTMLElement).dataset.tax);
      cmdSetTaxRate(g, v, say);
      sfxClick();
      refresh();
    });
  });
  panel.querySelectorAll('[data-speed]').forEach((el) => {
    el.addEventListener('click', () => {
      const sp = (el as HTMLElement).dataset.speed as GameSpeed;
      cmdSetGameSpeed(g, sp, say);
      sfxClick();
      refresh();
    });
  });
  panel.querySelector('#a-bus-auto')?.addEventListener('click', () => {
    const stops = g.cells
      .filter((c) => c.b && (c.b.id === 'station' || c.b.id === 'depot'))
      .map((c) => ({ x: c.x, y: c.y }));
    const r = cmdCreateBusLine(g, `Linie ${(g.busLines?.length || 0) + 1}`, stops, say);
    if (r.ok) sfxBuy();
    else sfxError();
    refresh();
  });
  panel.querySelector('#a-overlay-land')?.addEventListener('click', () => {
    view.overlay = view.overlay === 'land' ? null : 'land';
    sfxClick();
    paintPanel();
  });
  panel.querySelector('#a-overlay-traffic')?.addEventListener('click', () => {
    view.overlay = view.overlay === 'traffic' ? null : 'traffic';
    sfxClick();
    paintPanel();
  });
  panel.querySelector('#a-overlay-power')?.addEventListener('click', () => {
    view.overlay = view.overlay === 'power' ? null : 'power';
    sfxClick();
    paintPanel();
  });
  panel.querySelector('#a-overlay-health')?.addEventListener('click', () => {
    view.overlay = view.overlay === 'health' ? null : 'health';
    sfxClick();
    paintPanel();
  });
  panel.querySelector('#a-ev-invest')?.addEventListener('click', () => {
    const r = cmdAcceptEventChoice(g, 'invest', say);
    if (r.ok) {
      sfxBuy();
      refresh();
    } else sfxError();
  });
  panel.querySelector('#a-ev-ignore')?.addEventListener('click', () => {
    cmdAcceptEventChoice(g, 'ignore', say);
    sfxClick();
    refresh();
  });
  panel.querySelectorAll('[data-spec]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.spec as SpecId;
      if (cmdSetSpecialization(g, id, say).ok) {
        sfxUpgrade();
        refresh();
      } else sfxError();
    });
  });
  panel.querySelectorAll('[data-trade]').forEach((el) => {
    el.addEventListener('click', () => {
      const to = (el as HTMLElement).dataset.trade as RegionId;
      if (tradeToRegion(g, to, 'wood', 1, say)) {
        sfxBuy();
        refresh();
      } else sfxError();
    });
  });
  panel.querySelector('#a-cloud')?.addEventListener('click', () => {
    g.cloudSyncAt = Date.now();
    save(g);
    say('Cloud-Sync-Marker gesetzt (lokal). Echtes Backend folgt später.');
    sfxClick();
    paintPanel();
  });
  panel.querySelectorAll('[data-xp-pack]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.xpPack!;
      if (buyXpPack(g, id, say)) {
        sfxBuy();
        void haptic('medium');
        view.spawnBurst(g.size / 2, g.size / 2, '#f0d56a', 12);
      } else sfxError();
      refresh();
    });
  });
  panel.querySelectorAll('[data-iap]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.iap as IapSku;
      void (async () => {
        const ok = await purchaseIap(id);
        if (ok) {
          sfxBuy();
          void haptic('heavy');
          view.spawnBurst(g.size / 2, g.size / 2, '#7ad4ff', 18);
        }
        refresh();
      })();
    });
  });
  panel.querySelector('#a-iap-restore')?.addEventListener('click', () => {
    void restoreIap().then(() => refresh());
  });
  panel.querySelector('#a-buy-level')?.addEventListener('click', () => {
    if (buyNextLevel(g, say)) {
      sfxLevelUp();
      void haptic('heavy');
      view.spawnBurst(g.size / 2, g.size / 2, '#3ecf8e', 20);
    } else sfxError();
    refresh();
  });
  panel.querySelector('#a-disaster')?.addEventListener('click', () => {
    if (triggerDisaster(g, say)) sfxDisaster();
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
      const nextCmd = cmdSwitchCity(g, (el as HTMLElement).dataset.goto as RegionId, say);
      const next = nextCmd.ok ? nextCmd.data : null;
      if (next) {
        g = next;
        view.center(g);
        refresh();
      }
    });
  });
}

function showLevelUp(ev: LevelUpEvent) {
  levelModalOpen = true;
  const unlockHtml = ev.unlocks.length
    ? `<h3>Neu freigeschaltet</h3>
       <div class="unlock-chips">
         ${ev.unlocks.map((id) => `<span class="chip glow">${DEFS[id].icon} ${DEFS[id].name}</span>`).join('')}
       </div>`
    : `<p class="muted">Keine neuen Gebäude — trotzdem starke Belohnungen.</p>`;
  const r = ev.reward;
  const diff = difficulty(ev.level);
  modal.innerHTML = `
    <div class="modal level-up-modal">
      <div class="level-up-burst">LEVEL UP</div>
      <div class="level-up-title">${mayorTitle(ev.level)}</div>
      <h2>Level ${ev.level} erreicht!</h2>
      ${ev.milestone ? `<p class="milestone-banner">${ev.milestone}</p>` : ''}
      <p class="muted">Schwierigkeit jetzt: <strong>${diff.label}</strong> · Produktion ×${diff.prod.toFixed(2)}</p>
      <div class="reward-grid">
        <div class="reward">💰 +${r.cash}</div>
        <div class="reward">💎 +${r.gems}</div>
        ${r.tokens ? `<div class="reward">🎫 +${r.tokens}</div>` : ''}
        ${r.bronze ? `<div class="reward">🥉 +${r.bronze}</div>` : ''}
        ${r.silver ? `<div class="reward">🥈 +${r.silver}</div>` : ''}
        ${r.gold ? `<div class="reward">🥇 +${r.gold}</div>` : ''}
      </div>
      ${unlockHtml}
      <div class="row" style="margin-top:1rem"><button id="lvl-ok" class="primary">Weiter</button></div>
    </div>`;
  sfxLevelUp();
  void haptic('heavy');
  modal.querySelector('#lvl-ok')?.addEventListener('click', () => {
    sfxClick();
    modal.innerHTML = '';
    levelModalOpen = false;
    flushLevelUps();
  });
}

function flushLevelUps() {
  if (levelModalOpen) return;
  if (!g.pendingLevelUps.length) return;
  const next = g.pendingLevelUps.shift()!;
  save(g);
  showLevelUp(next);
  refresh();
}

function refresh() {
  g.lastSimAt = 0;
  paintHud();
  paintBar();
  paintPanel();
  save(g);
  flushLevelUps();
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
  view.hover = { x: Math.round(w.x), y: Math.round(w.y) };
  if (g.selected) {
    const err = canPlace(g, view.hover.x, view.hover.y, g.selected);
    view.placeOk = !err;
  } else view.placeOk = null;
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
  const x = Math.round(w.x);
  const y = Math.round(w.y);
  const c = cell(g, x, y);
  if (!c) return;

  unlockAudio();
  if (c.b && c.b.ready > 0 && !g.selected) {
    if (collect(g, x, y, say)) {
      view.spawnBurst(x, y, '#ffe566', 16);
      view.floatAt(x, y, '+Ressourcen', '#ffe566');
      sfxCollect();
      void haptic('medium');
      if (g.tutorialStep === 2) advanceTutorial(3);
    }
    g.focus = { x, y };
    tab = 'city';
    refresh();
    return;
  }
  if (g.selected) {
    const built = cmdBuildBuilding(g, x, y, g.selected, say);
    const ok = built.ok;
    if (ok) {
      view.spawnBurst(x, y, '#3ecf8e', 10);
      const price = scaledCost(DEFS[g.selected].cost, g.level);
      view.floatAt(x, y, `−${price}¢`, '#f0d56a');
      sfxPlace();
      void haptic('light');
      if (g.tutorialStep === 1 && (g.selected === 'road' || g.selected === 'highway')) advanceTutorial(2);
      if (g.tutorialStep === 2 && g.selected === 'house') advanceTutorial(3);
    } else {
      sfxError();
      // canPlace already toasted via say inside command
    }
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

let rafStarted = false;
function frame() {
  tick(g, say);
  view.draw(g);
  requestAnimationFrame(frame);
}

function startLoop() {
  if (rafStarted) return;
  rafStarted = true;
  requestAnimationFrame(frame);
}

/** Pause simulation when app is backgrounded (battery / resume safety). */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (g.gameSpeed !== 'pause') {
      (g as Game & { _speedBeforeHide?: string })._speedBeforeHide = g.gameSpeed || '1x';
      cmdSetGameSpeed(g, 'pause', () => {});
    }
  } else {
    const prev = (g as Game & { _speedBeforeHide?: GameSpeed })._speedBeforeHide || '1x';
    cmdSetGameSpeed(g, prev, () => {});
    startLoop();
  }
});

if (!localStorage.getItem('metrobuilder-full-intro')) {
  modal.innerHTML = `
    <div class="modal intro-modal">
      <div class="intro-badge">MetroBuilder</div>
      <h2>Baue deine Stadt</h2>
      <p class="muted">Straßen, Einwohner, Jobs und Verkehr — alles auf einem Blick. Offline spielbar.</p>
      <div class="row" style="margin-top:0.9rem"><button id="go" class="primary">Spielen</button></div>
    </div>`;
  modal.querySelector('#go')?.addEventListener('click', () => {
    localStorage.setItem('metrobuilder-full-intro', '1');
    modal.innerHTML = '';
    unlockAudio();
    sfxClick();
    void haptic('medium');
    paintTutorial();
  });
}

document.addEventListener(
  'pointerdown',
  () => {
    unlockAudio();
  },
  { once: true },
);

refresh();
paintTutorial();
startLoop();
setInterval(() => save(g), 4000);

void initIap({
  say,
  onGrant: (sku, receiptId) => {
    grantIap(g, sku, say, receiptId);
    refresh();
  },
}).then(() => {
  if (tab === 'level') paintPanel();
});

if (loaded.source === 'new') say('Vollversion bereit.');
