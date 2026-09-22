import { Capacitor } from '@capacitor/core';
import { IAP_PRODUCTS, iapDef, type IapSku } from './catalog';

export type IapStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

export interface IapOfferView {
  id: IapSku;
  title: string;
  blurb: string;
  price: string;
  kind: 'xp' | 'level';
  xp?: number;
  canPurchase: boolean;
}

type GrantFn = (sku: IapSku) => void;
type SayFn = (msg: string) => void;

let status: IapStatus = 'idle';
let grantReward: GrantFn | null = null;
let say: SayFn | null = null;
let priceMap = new Map<string, string>();
let readyPromise: Promise<void> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cdv(): any {
  return (globalThis as unknown as { CdvPurchase?: unknown }).CdvPurchase;
}

export function getIapStatus(): IapStatus {
  return status;
}

export function listIapOffers(): IapOfferView[] {
  return IAP_PRODUCTS.map((p) => ({
    id: p.id,
    title: p.title,
    blurb: p.blurb,
    price: priceMap.get(p.id) || p.fallbackPrice,
    kind: p.kind,
    xp: p.xp,
    canPurchase: status === 'ready' || status === 'unavailable',
  }));
}

function applyPurchase(productId: string) {
  const def = iapDef(productId);
  if (!def || !grantReward) return;
  grantReward(def.id);
}

/** Initialize StoreKit / Play Billing (or web sandbox). */
export function initIap(opts: { onGrant: GrantFn; say: SayFn }): Promise<void> {
  grantReward = opts.onGrant;
  say = opts.say;
  if (readyPromise) return readyPromise;
  readyPromise = boot();
  return readyPromise;
}

async function boot(): Promise<void> {
  status = 'loading';
  try {
    if (Capacitor.isNativePlatform()) {
      await bootNative();
    } else {
      await bootWebSandbox();
    }
  } catch (e) {
    console.warn('[iap]', e);
    status = 'error';
    for (const p of IAP_PRODUCTS) priceMap.set(p.id, p.fallbackPrice);
  }
}

async function bootWebSandbox(): Promise<void> {
  for (const p of IAP_PRODUCTS) priceMap.set(p.id, p.fallbackPrice + ' · Demo');
  status = 'ready';
}

async function bootNative(): Promise<void> {
  try {
    await import('cordova-plugin-purchase/www/store.js');
  } catch {
    /* bridge may inject later */
  }
  const Cdv = cdv();
  if (!Cdv?.store) {
    status = 'unavailable';
    for (const p of IAP_PRODUCTS) priceMap.set(p.id, p.fallbackPrice);
    say?.('IAP-Plugin nicht geladen — Capability & Sync prüfen.');
    return;
  }

  const { store, ProductType, Platform, LogLevel } = Cdv;
  store.verbosity = LogLevel.INFO;

  store.register(
    IAP_PRODUCTS.map((p) => ({
      id: p.id,
      type: ProductType.CONSUMABLE,
      platform: Capacitor.getPlatform() === 'ios' ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY,
    })),
  );

  store
    .when()
    .productUpdated((product: { id: string; pricing?: { price?: string } }) => {
      if (product.pricing?.price) priceMap.set(product.id, product.pricing.price);
    })
    .approved(
      (transaction: { products: Array<{ id: string }>; finish: () => Promise<void> | void }) => {
        const id = transaction.products[0]?.id;
        if (id) applyPurchase(id);
        void Promise.resolve(transaction.finish());
      },
    )
    .finished(() => {
      /* consumed */
    });

  store.error((err: { message?: string }) => {
    say?.(err?.message || 'Kauf fehlgeschlagen.');
  });

  const platforms =
    Capacitor.getPlatform() === 'ios'
      ? [Platform.APPLE_APPSTORE]
      : Capacitor.getPlatform() === 'android'
        ? [Platform.GOOGLE_PLAY]
        : [Platform.TEST];

  await store.initialize(platforms);

  for (const p of IAP_PRODUCTS) {
    const found = store.get(p.id);
    const price = found?.pricing?.price;
    if (price) priceMap.set(p.id, price);
    else priceMap.set(p.id, p.fallbackPrice);
  }

  status = 'ready';
}

/** Start purchase flow for a product */
export async function purchaseIap(sku: IapSku): Promise<boolean> {
  if (status !== 'ready' && status !== 'unavailable') {
    say?.('Store lädt noch…');
    return false;
  }

  if (!Capacitor.isNativePlatform()) {
    applyPurchase(sku);
    say?.('Demo-Kauf (Web) — in der App mit Echtgeld über den Store.');
    return true;
  }

  const Cdv = cdv();
  if (!Cdv?.store) {
    say?.('In-App-Käufe nicht verfügbar.');
    return false;
  }

  const product = Cdv.store.get(sku);
  const offer = product?.getOffer?.();
  if (!offer) {
    say?.('Produkt nicht im Store gefunden. In App Store Connect anlegen.');
    return false;
  }

  const result = await Cdv.store.order(offer);
  if (result && result.isError) {
    say?.(result.message || 'Kauf abgebrochen.');
    return false;
  }
  return true;
}

/** Restore purchases */
export async function restoreIap(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    say?.('Wiederherstellen nur in der App Store Version.');
    return;
  }
  const Cdv = cdv();
  if (!Cdv?.store) {
    say?.('Store nicht bereit.');
    return;
  }
  await Cdv.store.restorePurchases();
  say?.('Käufe wiederhergestellt.');
}
