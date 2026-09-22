import { Capacitor } from '@capacitor/core';
import { IAP_PRODUCTS, iapDef, type IapSku } from './catalog';

export type IapStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';
export type IapStoreId = 'apple' | 'google' | 'web' | 'none';

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
let activeStore: IapStoreId = 'none';
let grantReward: GrantFn | null = null;
let say: SayFn | null = null;
let priceMap = new Map<string, string>();
let readyPromise: Promise<void> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cdv(): any {
  return (globalThis as unknown as { CdvPurchase?: unknown }).CdvPurchase;
}

function detectStore(): IapStoreId {
  if (!Capacitor.isNativePlatform()) return 'web';
  const p = Capacitor.getPlatform();
  if (p === 'ios') return 'apple';
  if (p === 'android') return 'google';
  return 'none';
}

export function getIapStatus(): IapStatus {
  return status;
}

export function getActiveStore(): IapStoreId {
  return activeStore;
}

/** Human label for UI */
export function storeLabel(store: IapStoreId = activeStore): string {
  switch (store) {
    case 'apple':
      return 'Apple App Store';
    case 'google':
      return 'Google Play';
    case 'web':
      return 'Web-Demo';
    default:
      return 'Kein Store';
  }
}

export function listIapOffers(): IapOfferView[] {
  return IAP_PRODUCTS.map((p) => ({
    id: p.id,
    title: p.title,
    blurb: p.blurb,
    price: priceMap.get(p.id) || p.fallbackPrice,
    kind: p.kind,
    xp: p.xp,
    canPurchase: status === 'ready',
  }));
}

function applyPurchase(productId: string) {
  const def = iapDef(productId);
  if (!def || !grantReward) return;
  grantReward(def.id);
}

function waitMs(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Wait until Cordova/Capacitor bridge exposes CdvPurchase (native only). */
async function waitForCdv(timeoutMs = 8000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (cdv()?.store) return true;
    try {
      await import('cordova-plugin-purchase/www/store.js');
    } catch {
      /* ignore */
    }
    if (cdv()?.store) return true;
    await waitMs(200);
  }
  return !!cdv()?.store;
}

/** Initialize Apple App Store (StoreKit) and/or Google Play Billing. */
export function initIap(opts: { onGrant: GrantFn; say: SayFn }): Promise<void> {
  grantReward = opts.onGrant;
  say = opts.say;
  if (readyPromise) return readyPromise;
  readyPromise = boot();
  return readyPromise;
}

async function boot(): Promise<void> {
  status = 'loading';
  activeStore = detectStore();
  try {
    if (activeStore === 'web') {
      await bootWebSandbox();
    } else if (activeStore === 'apple' || activeStore === 'google') {
      await bootNative(activeStore);
    } else {
      status = 'unavailable';
      for (const p of IAP_PRODUCTS) priceMap.set(p.id, p.fallbackPrice);
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

async function bootNative(storeId: 'apple' | 'google'): Promise<void> {
  const ok = await waitForCdv();
  const Cdv = cdv();
  if (!ok || !Cdv?.store) {
    status = 'unavailable';
    for (const p of IAP_PRODUCTS) priceMap.set(p.id, p.fallbackPrice);
    say?.(
      storeId === 'apple'
        ? 'Apple IAP nicht geladen — In-App Purchase Capability in Xcode prüfen.'
        : 'Google Play Billing nicht geladen — Play Console & Billing Library prüfen.',
    );
    return;
  }

  const { store, ProductType, Platform, LogLevel } = Cdv;
  store.verbosity = LogLevel.INFO;

  const platform = storeId === 'apple' ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;

  // Register the same SKUs for the active store (Apple App Store oder Google Play)
  store.register(
    IAP_PRODUCTS.map((p) => ({
      id: p.id,
      type: ProductType.CONSUMABLE,
      platform,
    })),
  );

  store
    .when()
    .productUpdated((product: { id: string; pricing?: { price?: string } }) => {
      if (product.pricing?.price) priceMap.set(product.id, product.pricing.price);
    })
    .approved(
      (transaction: {
        products: Array<{ id: string }>;
        finish: () => Promise<void> | void;
      }) => {
        const id = transaction.products[0]?.id;
        if (id) applyPurchase(id);
        // finish() = consume on Google Play / finish transaction on Apple
        void Promise.resolve(transaction.finish());
      },
    );

  store.error((err: { code?: number; message?: string }) => {
    const msg = err?.message || 'Kauf fehlgeschlagen.';
    // Ignore cancelled purchases as hard errors in UI toast noise if cancelled
    if (/cancel|abgebrochen|user_cancelled/i.test(msg)) {
      say?.('Kauf abgebrochen.');
      return;
    }
    say?.(`${storeLabel(storeId)}: ${msg}`);
  });

  const errors = await store.initialize([platform]);
  if (Array.isArray(errors) && errors.length) {
    console.warn('[iap] init errors', errors);
  }

  // Pull localized prices from the live store
  try {
    if (typeof store.update === 'function') await store.update();
  } catch {
    /* optional */
  }

  for (const p of IAP_PRODUCTS) {
    const found = store.get(p.id, platform) || store.get(p.id);
    const price = found?.pricing?.price;
    priceMap.set(p.id, price || p.fallbackPrice);
  }

  status = 'ready';
  say?.(
    storeId === 'apple'
      ? 'Apple App Store verbunden.'
      : 'Google Play Billing verbunden.',
  );
}

/** Start purchase via Apple App Store or Google Play */
export async function purchaseIap(sku: IapSku): Promise<boolean> {
  if (status === 'loading') {
    say?.('Store lädt noch…');
    return false;
  }

  if (activeStore === 'web') {
    applyPurchase(sku);
    say?.('Demo-Kauf (Web). Echtgeld nur in Apple App Store / Google Play App.');
    return true;
  }

  if (status !== 'ready') {
    say?.(`${storeLabel()} nicht bereit. Produkte in der Console anlegen?`);
    return false;
  }

  const Cdv = cdv();
  if (!Cdv?.store) {
    say?.('In-App-Käufe nicht verfügbar.');
    return false;
  }

  const platform =
    activeStore === 'apple'
      ? Cdv.Platform.APPLE_APPSTORE
      : Cdv.Platform.GOOGLE_PLAY;

  const product = Cdv.store.get(sku, platform) || Cdv.store.get(sku);
  const offer = product?.getOffer?.();
  if (!offer) {
    say?.(
      activeStore === 'apple'
        ? 'Produkt fehlt in App Store Connect (gleiche Product ID).'
        : 'Produkt fehlt in Google Play Console (gleiche Product ID).',
    );
    return false;
  }

  const result = await Cdv.store.order(offer);
  if (result && result.isError) {
    say?.(result.message || 'Kauf abgebrochen.');
    return false;
  }
  return true;
}

/**
 * Restore: relevant for Apple ID / Play account ownership.
 * Consumables are usually not restorable; still required UX on iOS.
 */
export async function restoreIap(): Promise<void> {
  if (activeStore === 'web') {
    say?.('Wiederherstellen nur in der App (Apple-ID / Google-Konto).');
    return;
  }
  const Cdv = cdv();
  if (!Cdv?.store) {
    say?.('Store nicht bereit.');
    return;
  }
  try {
    await Cdv.store.restorePurchases();
    say?.(
      activeStore === 'apple'
        ? 'Mit Apple-ID synchronisiert (App Store / iCloud-Konto).'
        : 'Mit Google-Konto synchronisiert (Play Store).',
    );
  } catch (e) {
    say?.('Wiederherstellen fehlgeschlagen.');
    console.warn('[iap] restore', e);
  }
}
