import type { BuildDef, BuildId, HouseTier, Res } from './types';

export const SIZE = 24;
export const START_R = 5;
export const TAX_MS = 15_000;
export const SAVE = 'metrobuilder-core-v2';

export const RES: Record<Res, { name: string; icon: string; sell: number }> = {
  wood: { name: 'Holz', icon: '🪵', sell: 2 },
  planks: { name: 'Bretter', icon: '📦', sell: 8 },
};

export const HOUSE: HouseTier[] = [
  { level: 1, name: 'Hütte', pop: 4, tax: 10, cost: 40, needs: {} },
  { level: 2, name: 'Haus', pop: 12, tax: 28, cost: 100, needs: { planks: 3 } },
  { level: 3, name: 'Villa', pop: 28, tax: 70, cost: 280, needs: { planks: 8, wood: 4 } },
];

export const DEFS: Record<BuildId, BuildDef> = {
  road: {
    id: 'road',
    name: 'Straße',
    cost: 4,
    needsRoad: false,
    power: 0,
    water: 0,
    color: '#5c5c5c',
    icon: '═',
    blurb: 'Jedes Gebäude braucht eine angrenzende Straße.',
  },
  house: {
    id: 'house',
    name: 'Wohnhaus',
    cost: 40,
    needsRoad: true,
    power: 1,
    water: 1,
    color: '#c9855a',
    icon: '⌂',
    blurb: 'Einwohner & Steuern. Upgrade mit Brettern.',
  },
  woodcutter: {
    id: 'woodcutter',
    name: 'Holzfäller',
    cost: 60,
    needsRoad: true,
    power: 1,
    water: 0,
    produce: { out: 'wood', amount: 2, ms: 12_000 },
    color: '#2d6a4f',
    icon: '🌲',
    blurb: 'Produziert Holz (kein Input).',
  },
  sawmill: {
    id: 'sawmill',
    name: 'Sägewerk',
    cost: 90,
    needsRoad: true,
    power: 1,
    water: 0,
    produce: { out: 'planks', amount: 1, ms: 18_000, in: { wood: 2 } },
    color: '#9c6644',
    icon: '🪚',
    blurb: '2 Holz → 1 Bretter.',
  },
  power: {
    id: 'power',
    name: 'Kraftwerk',
    cost: 120,
    needsRoad: true,
    power: 0,
    water: 0,
    radius: 4,
    color: '#e9c46a',
    icon: '⚡',
    blurb: 'Versorgt Gebäude im Radius mit Strom.',
  },
  water: {
    id: 'water',
    name: 'Wasserturm',
    cost: 100,
    needsRoad: true,
    power: 0,
    water: 0,
    radius: 4,
    color: '#4cc9f0',
    icon: '💧',
    blurb: 'Versorgt Gebäude im Radius mit Wasser.',
  },
  park: {
    id: 'park',
    name: 'Park',
    cost: 50,
    needsRoad: true,
    power: 0,
    water: 0,
    radius: 2,
    color: '#52b788',
    icon: '🌳',
    blurb: 'Hebt Zufriedenheit in der Nähe.',
  },
};

export const BUILD_ORDER: BuildId[] = [
  'road',
  'house',
  'woodcutter',
  'sawmill',
  'power',
  'water',
  'park',
];
