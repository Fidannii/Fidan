/**
 * Generates App Store screenshot PNGs (iPhone 6.7" 1290×2796).
 * Usage: node scripts/generate-store-screenshots.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const OUT = path.resolve('store/screenshots');
fs.mkdirSync(OUT, { recursive: true });

const SIZE = 28;
const START_R = 8;
const cx = Math.floor(SIZE / 2);
const cy = Math.floor(SIZE / 2);

function idx(x, y) {
  return y * SIZE + x;
}

function makeDemoSave() {
  const cells = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = Math.hypot(x - cx, y - cy);
      cells.push({
        x,
        y,
        terrain: d <= START_R ? 'grass' : 'void',
        b: null,
      });
    }
  }
  const put = (x, y, id, level = 1) => {
    const c = cells[idx(x, y)];
    c.terrain = 'grass';
    c.b = { id, level, jobAt: Date.now() - 5000, ready: 1, wear: 0 };
  };
  for (let i = cx - 5; i <= cx + 5; i++) {
    put(i, cy, 'road');
    put(cx, cy - 5 + (i - (cx - 5)), 'road');
  }
  put(cx - 1, cy - 1, 'house', 3);
  put(cx + 1, cy - 1, 'house', 2);
  put(cx - 2, cy - 2, 'house', 2);
  put(cx + 2, cy - 2, 'house', 1);
  put(cx + 1, cy + 1, 'woodcutter');
  put(cx + 2, cy + 1, 'sawmill');
  put(cx + 3, cy + 1, 'mine');
  put(cx + 3, cy + 2, 'workshop');
  put(cx - 1, cy + 1, 'power');
  put(cx - 2, cy + 1, 'water');
  put(cx - 3, cy + 1, 'sewage');
  put(cx - 3, cy - 1, 'park');
  put(cx - 4, cy - 1, 'school');
  put(cx + 4, cy - 1, 'police');
  put(cx + 4, cy + 1, 'fire');
  put(cx - 4, cy + 1, 'hospital');
  put(cx, cy - 3, 'cinema');
  put(cx + 2, cy - 4, 'stadium');
  put(cx - 2, cy - 4, 'landmark');
  put(cx + 4, cy - 3, 'depot');
  put(cx - 4, cy - 3, 'station');

  return {
    cash: 2850,
    gems: 24,
    keys: { bronze: 3, silver: 1, gold: 0 },
    tokens: 6,
    inv: {
      wood: 18,
      metal: 12,
      plastic: 8,
      glass: 6,
      chemicals: 4,
      planks: 10,
      tools: 5,
      furniture: 3,
      fabric: 4,
    },
    cells,
    size: SIZE,
    unlock: START_R,
    level: 28,
    xp: 1200,
    lastTax: Date.now(),
    selected: null,
    focus: null,
    quests: [
      { id: 'roads', title: 'Baue 5 Straßen', cur: 5, max: 5, done: true, rewardCash: 60, rewardGems: 1 },
      { id: 'wood', title: 'Sammle 10 Holz', cur: 10, max: 10, done: true, rewardCash: 70, rewardToken: 1 },
      { id: 'planks', title: 'Stelle 4 Bretter her', cur: 4, max: 4, done: true, rewardCash: 90, rewardKey: 'bronze' },
      { id: 'upgrade', title: 'Upgrade 1 Haus', cur: 1, max: 1, done: true, rewardCash: 140, rewardGems: 2 },
      { id: 'expand', title: 'Erweitere die Stadt', cur: 1, max: 1, done: true, rewardCash: 200, rewardKey: 'silver' },
      { id: 'services', title: 'Baue Polizei o. Feuerwehr', cur: 1, max: 1, done: true, rewardCash: 120 },
    ],
    built: 28,
    region: 'valley',
    unlockedRegions: ['valley', 'desert', 'coast'],
    disasterUntil: null,
    weekScore: 420,
    weekEnds: Date.now() + 8 * 60_000,
    mayorRank: 3,
    club: {
      name: 'Metro Club',
      members: [
        { name: 'Du', score: 420, ai: false, avatar: 'player' },
        { name: 'Lina', score: 380, ai: true, avatar: 'lina' },
        { name: 'Omar', score: 350, ai: true, avatar: 'omar' },
        { name: 'Mira', score: 290, ai: true, avatar: 'mira' },
      ],
      warScore: 72,
      warTarget: 100,
    },
    offers: [
      {
        id: 'o1',
        res: 'wood',
        amount: 10,
        price: 40,
        from: 'Alex',
        avatar: 'alex',
        expires: Date.now() + 600_000,
      },
      {
        id: 'o2',
        res: 'planks',
        amount: 4,
        price: 55,
        from: 'Kai',
        avatar: 'kai',
        expires: Date.now() + 600_000,
      },
    ],
    lastOfferAt: Date.now(),
    stats: { collected: 120, upgrades: 8, disasters: 1 },
    pendingLevelUps: [
      {
        level: 30,
        reward: { cash: 920, gems: 4, tokens: 1, bronze: 1 },
        unlocks: ['school'],
        milestone: 'Meilenstein: Dienstnetz',
      },
    ],
  };
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.waitForTimeout(700);
  await page.screenshot({ path: file, type: 'png' });
  console.log('wrote', file);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3, // → 1290×2796
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate((save) => {
  localStorage.setItem('metrobuilder-full-v3', JSON.stringify(save));
  localStorage.setItem('metrobuilder-full-intro', '1');
}, makeDemoSave());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#stage');
await page.waitForTimeout(1200);

// Level-up modal screenshot (seeded pendingLevelUps)
await shot(page, '03-levelup-iphone67.png');

const dismiss = page.locator('#lvl-ok');
if (await dismiss.count()) {
  await dismiss.click();
  await page.waitForTimeout(400);
}

await shot(page, '01-city-iphone67.png');

await page.locator('[data-tab="club"]').click();
await shot(page, '02-club-iphone67.png');

await page.locator('[data-tab="level"]').click();
await shot(page, '03-level-iphone67.png');

await page.locator('[data-tab="market"]').click();
await shot(page, '04-market-iphone67.png');

await page.locator('[data-tab="regions"]').click();
await shot(page, '05-regions-iphone67.png');

// also 6.5" style (1242×2688) via different viewport
await context.close();
const ctx65 = await browser.newContext({
  viewport: { width: 414, height: 896 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const p65 = await ctx65.newPage();
await p65.goto(BASE, { waitUntil: 'networkidle' });
await p65.evaluate((save) => {
  localStorage.setItem('metrobuilder-full-v3', JSON.stringify(save));
  localStorage.setItem('metrobuilder-full-intro', '1');
}, makeDemoSave());
await p65.reload({ waitUntil: 'networkidle' });
await p65.waitForSelector('#stage');
await p65.waitForTimeout(1000);
const d = p65.locator('#modal-root button').first();
if (await d.count()) {
  try {
    await d.click({ timeout: 1000 });
  } catch {
    /* */
  }
}
await p65.screenshot({ path: path.join(OUT, '01-city-iphone65.png'), type: 'png' });
console.log('wrote 01-city-iphone65.png');

await browser.close();
console.log('Done. Upload PNGs from store/screenshots/ to App Store Connect.');
