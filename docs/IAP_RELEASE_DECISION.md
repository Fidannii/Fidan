# IAP Release Decision (Store RC1)

## Decision: **IAP_SHIP** (soft UX) — sandbox still external

Rationale:
- Consumable XP/level products already wired via Cordova Purchase
- Idempotent receipt handling unit-tested
- Core game fully playable without purchase
- Intro/tutorial no longer push IAP in first minutes

## Still required externally (NOT_RUN here)

- Apple StoreKit sandbox purchase + restore — `APPLE_SANDBOX_TEST_PLAN.md`
- Google Play billing test purchase + acknowledge — `GOOGLE_BILLING_TEST_PLAN.md`
- Pending / cancel / network loss on device

## Guardrails shipped

- No purchase modal on cold start
- Web shows demo prices only
- Duplicate transaction IDs do not double-grant (tested)

If sandbox fails on TestFlight/Play Internal: switch to **IAP_DISABLE_RC1** before production submit — do not ship a broken checkout.
