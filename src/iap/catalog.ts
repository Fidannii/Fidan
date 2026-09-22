/** App Store / Play Store product IDs (must match Connect / Play Console) */

export type IapSku =
  | 'com.fidani.metrobuilder.xp_small'
  | 'com.fidani.metrobuilder.xp_medium'
  | 'com.fidani.metrobuilder.xp_large'
  | 'com.fidani.metrobuilder.level_up';

export interface IapProductDef {
  id: IapSku;
  /** Fallback display price until store metadata loads */
  fallbackPrice: string;
  title: string;
  blurb: string;
  kind: 'xp' | 'level';
  xp?: number;
}

export const IAP_PRODUCTS: IapProductDef[] = [
  {
    id: 'com.fidani.metrobuilder.xp_small',
    fallbackPrice: '0,99 €',
    title: 'XP Starter',
    blurb: '+200 XP',
    kind: 'xp',
    xp: 200,
  },
  {
    id: 'com.fidani.metrobuilder.xp_medium',
    fallbackPrice: '2,99 €',
    title: 'XP Booster',
    blurb: '+800 XP',
    kind: 'xp',
    xp: 800,
  },
  {
    id: 'com.fidani.metrobuilder.xp_large',
    fallbackPrice: '5,99 €',
    title: 'XP Mega',
    blurb: '+2.500 XP',
    kind: 'xp',
    xp: 2500,
  },
  {
    id: 'com.fidani.metrobuilder.level_up',
    fallbackPrice: '1,99 €',
    title: 'Sofort-Level',
    blurb: 'Nächstes Level freischalten',
    kind: 'level',
  },
];

export function iapDef(id: string): IapProductDef | undefined {
  return IAP_PRODUCTS.find((p) => p.id === id);
}
