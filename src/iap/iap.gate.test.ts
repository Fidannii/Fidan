import { describe, expect, it } from 'vitest';
import { IAP_ENABLED_FOR_PRODUCTION } from './flags';
import { initIap, getIapStatus, listIapOffers } from './iap';

describe('IAP production shipping gate', () => {
  it('disables real-money IAP for first production until sandbox evidenced', () => {
    expect(IAP_ENABLED_FOR_PRODUCTION).toBe(false);
  });

  it('init leaves store unavailable and offers non-purchasable when gated off', async () => {
    await initIap({ onGrant: () => {}, say: () => {} });
    expect(getIapStatus()).toBe('unavailable');
    // listIapOffers still returns catalog metadata, but canPurchase is false when not ready
    expect(listIapOffers().every((o) => o.canPurchase === false)).toBe(true);
  });
});
