export type ResourceId =
  | 'wood'
  | 'metal'
  | 'plastic'
  | 'glass'
  | 'planks'
  | 'tools'
  | 'furniture'
  | 'fabric';

export type BuildingKind =
  | 'road'
  | 'house'
  | 'woodmill'
  | 'metalmine'
  | 'plasticplant'
  | 'glassworks'
  | 'sawmill'
  | 'workshop'
  | 'furniture'
  | 'textile'
  | 'power'
  | 'water'
  | 'sewage'
  | 'waste'
  | 'police'
  | 'fire'
  | 'hospital'
  | 'park'
  | 'school'
  | 'landmark';

export type Terrain = 'locked' | 'grass' | 'water' | 'dirt';

export interface BuildingDef {
  id: BuildingKind;
  name: string;
  category: 'infra' | 'housing' | 'raw' | 'process' | 'service' | 'special';
  cost: number;
  emoji: string;
  color: string;
  needsRoad: boolean;
  powerNeed: number;
  waterNeed: number;
  produce?: {
    resource: ResourceId;
    amount: number;
    seconds: number;
    inputs?: Partial<Record<ResourceId, number>>;
  };
  radius?: number;
  unlockLevel: number;
  description: string;
}

export interface HouseLevelDef {
  level: number;
  name: string;
  pop: number;
  tax: number;
  cost: number;
  needs: Partial<Record<ResourceId, number>>;
}

export const RESOURCES: Record<
  ResourceId,
  { name: string; emoji: string; softSell: number }
> = {
  wood: { name: 'Holz', emoji: '🪵', softSell: 2 },
  metal: { name: 'Metall', emoji: '⚙️', softSell: 3 },
  plastic: { name: 'Kunststoff', emoji: '🧪', softSell: 3 },
  glass: { name: 'Glas', emoji: '🪟', softSell: 4 },
  planks: { name: 'Bretter', emoji: '📦', softSell: 8 },
  tools: { name: 'Werkzeug', emoji: '🔧', softSell: 12 },
  furniture: { name: 'Möbel', emoji: '🪑', softSell: 18 },
  fabric: { name: 'Stoffe', emoji: '🧵', softSell: 10 },
};

export const HOUSE_LEVELS: HouseLevelDef[] = [
  { level: 1, name: 'Hütte', pop: 4, tax: 8, cost: 50, needs: {} },
  {
    level: 2,
    name: 'Haus',
    pop: 10,
    tax: 22,
    cost: 120,
    needs: { planks: 2, tools: 1 },
  },
  {
    level: 3,
    name: 'Villa',
    pop: 22,
    tax: 55,
    cost: 320,
    needs: { planks: 4, furniture: 2, fabric: 2, glass: 2 },
  },
  {
    level: 4,
    name: 'Turm',
    pop: 48,
    tax: 140,
    cost: 900,
    needs: { furniture: 5, tools: 4, fabric: 4, glass: 4, plastic: 3 },
  },
];

export const BUILDINGS: Record<BuildingKind, BuildingDef> = {
  road: {
    id: 'road',
    name: 'Straße',
    category: 'infra',
    cost: 5,
    emoji: '🛣️',
    color: '#5a5a5a',
    needsRoad: false,
    powerNeed: 0,
    waterNeed: 0,
    unlockLevel: 1,
    description: 'Pflicht-Anbindung für alle Gebäude.',
  },
  house: {
    id: 'house',
    name: 'Wohnhaus',
    category: 'housing',
    cost: 50,
    emoji: '🏠',
    color: '#d4a574',
    needsRoad: true,
    powerNeed: 1,
    waterNeed: 1,
    unlockLevel: 1,
    description: 'Bevölkerung & Steuern. Upgrade mit Waren.',
  },
  woodmill: {
    id: 'woodmill',
    name: 'Sägewerk',
    category: 'raw',
    cost: 80,
    emoji: '🌲',
    color: '#2d6a4f',
    needsRoad: true,
    powerNeed: 1,
    waterNeed: 0,
    produce: { resource: 'wood', amount: 3, seconds: 20 },
    unlockLevel: 1,
    description: 'Produziert Holz ohne Zutaten.',
  },
  metalmine: {
    id: 'metalmine',
    name: 'Bergwerk',
    category: 'raw',
    cost: 120,
    emoji: '⛏️',
    color: '#6c757d',
    needsRoad: true,
    powerNeed: 2,
    waterNeed: 0,
    produce: { resource: 'metal', amount: 2, seconds: 35 },
    unlockLevel: 2,
    description: 'Fördert Metall.',
  },
  plasticplant: {
    id: 'plasticplant',
    name: 'Chemie',
    category: 'raw',
    cost: 150,
    emoji: '🏭',
    color: '#7b2cbf',
    needsRoad: true,
    powerNeed: 2,
    waterNeed: 1,
    produce: { resource: 'plastic', amount: 2, seconds: 40 },
    unlockLevel: 3,
    description: 'Produziert Kunststoff.',
  },
  glassworks: {
    id: 'glassworks',
    name: 'Glashütte',
    category: 'raw',
    cost: 160,
    emoji: '🫙',
    color: '#48cae4',
    needsRoad: true,
    powerNeed: 2,
    waterNeed: 1,
    produce: { resource: 'glass', amount: 2, seconds: 45 },
    unlockLevel: 3,
    description: 'Produziert Glas.',
  },
  sawmill: {
    id: 'sawmill',
    name: 'Schreinerei',
    category: 'process',
    cost: 140,
    emoji: '🪚',
    color: '#b08968',
    needsRoad: true,
    powerNeed: 1,
    waterNeed: 0,
    produce: {
      resource: 'planks',
      amount: 2,
      seconds: 30,
      inputs: { wood: 3 },
    },
    unlockLevel: 1,
    description: 'Verarbeitet Holz zu Brettern.',
  },
  workshop: {
    id: 'workshop',
    name: 'Werkstatt',
    category: 'process',
    cost: 180,
    emoji: '🔩',
    color: '#e76f51',
    needsRoad: true,
    powerNeed: 2,
    waterNeed: 0,
    produce: {
      resource: 'tools',
      amount: 1,
      seconds: 50,
      inputs: { metal: 2, wood: 1 },
    },
    unlockLevel: 2,
    description: 'Stellt Werkzeug her.',
  },
  furniture: {
    id: 'furniture',
    name: 'Möbelfabrik',
    category: 'process',
    cost: 260,
    emoji: '🛋️',
    color: '#9c6644',
    needsRoad: true,
    powerNeed: 2,
    waterNeed: 1,
    produce: {
      resource: 'furniture',
      amount: 1,
      seconds: 70,
      inputs: { planks: 2, fabric: 1 },
    },
    unlockLevel: 3,
    description: 'Fertigt Möbel.',
  },
  textile: {
    id: 'textile',
    name: 'Textilwerk',
    category: 'process',
    cost: 200,
    emoji: '🧵',
    color: '#f72585',
    needsRoad: true,
    powerNeed: 1,
    waterNeed: 1,
    produce: {
      resource: 'fabric',
      amount: 2,
      seconds: 55,
      inputs: { plastic: 1 },
    },
    unlockLevel: 3,
    description: 'Webt Stoffe aus Kunststoff.',
  },
  power: {
    id: 'power',
    name: 'Kraftwerk',
    category: 'service',
    cost: 200,
    emoji: '⚡',
    color: '#ffd166',
    needsRoad: true,
    powerNeed: 0,
    waterNeed: 0,
    radius: 5,
    unlockLevel: 1,
    description: 'Versorgt Gebäude mit Energie.',
  },
  water: {
    id: 'water',
    name: 'Wasserturm',
    category: 'service',
    cost: 160,
    emoji: '💧',
    color: '#00b4d8',
    needsRoad: true,
    powerNeed: 1,
    waterNeed: 0,
    radius: 5,
    unlockLevel: 1,
    description: 'Versorgt Gebäude mit Wasser.',
  },
  sewage: {
    id: 'sewage',
    name: 'Kläranlage',
    category: 'service',
    cost: 180,
    emoji: '🚰',
    color: '#457b9d',
    needsRoad: true,
    powerNeed: 1,
    waterNeed: 0,
    radius: 4,
    unlockLevel: 2,
    description: 'Abwasser — hält Zufriedenheit stabil.',
  },
  waste: {
    id: 'waste',
    name: 'Mülldepot',
    category: 'service',
    cost: 140,
    emoji: '🗑️',
    color: '#6d6875',
    needsRoad: true,
    powerNeed: 1,
    waterNeed: 0,
    radius: 4,
    unlockLevel: 2,
    description: 'Müllentsorgung für Wohngebiete.',
  },
  police: {
    id: 'police',
    name: 'Polizei',
    category: 'service',
    cost: 220,
    emoji: '🚓',
    color: '#1d3557',
    needsRoad: true,
    powerNeed: 1,
    waterNeed: 1,
    radius: 6,
    unlockLevel: 2,
    description: 'Sicherheitsradius für Wohngebäude.',
  },
  fire: {
    id: 'fire',
    name: 'Feuerwehr',
    category: 'service',
    cost: 220,
    emoji: '🚒',
    color: '#e63946',
    needsRoad: true,
    powerNeed: 1,
    waterNeed: 1,
    radius: 6,
    unlockLevel: 2,
    description: 'Brandschutz-Radius.',
  },
  hospital: {
    id: 'hospital',
    name: 'Krankenhaus',
    category: 'service',
    cost: 300,
    emoji: '🏥',
    color: '#ffffff',
    needsRoad: true,
    powerNeed: 2,
    waterNeed: 2,
    radius: 7,
    unlockLevel: 3,
    description: 'Gesundheitsversorgung.',
  },
  park: {
    id: 'park',
    name: 'Park',
    category: 'special',
    cost: 90,
    emoji: '🌳',
    color: '#52b788',
    needsRoad: true,
    powerNeed: 0,
    waterNeed: 1,
    radius: 3,
    unlockLevel: 1,
    description: 'Zufriedenheits-Booster für Nachbarn.',
  },
  school: {
    id: 'school',
    name: 'Schule',
    category: 'special',
    cost: 280,
    emoji: '🏫',
    color: '#f4a261',
    needsRoad: true,
    powerNeed: 1,
    waterNeed: 1,
    radius: 5,
    unlockLevel: 3,
    description: 'Bildung — mehr Steuern & höhere Wohnstufen.',
  },
  landmark: {
    id: 'landmark',
    name: 'Wahrzeichen',
    category: 'special',
    cost: 1200,
    emoji: '🗽',
    color: '#cdb4db',
    needsRoad: true,
    powerNeed: 3,
    waterNeed: 2,
    unlockLevel: 4,
    description: 'Prestige: +8 % globale Zufriedenheit.',
  },
};

export const MAP_SIZE = 32;
export const START_UNLOCK = 12;
export const TAX_INTERVAL_MS = 20_000;
export const SAVE_KEY = 'metrobuilder-save-v1';
