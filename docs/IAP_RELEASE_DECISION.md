# IAP Release Decision (Store RC1)

## Decision: **A — Keep IAP enabled (soft UX)**

Rationale:
- Consumable XP/level products already wired via Cordova Purchase
- Idempotent receipt handling unit-tested
- Core game fully playable without purchase
- Intro/tutorial no longer push IAP in first minutes

## Still required externally (NOT_RUN here)

- Apple StoreKit sandbox purchase + restore
- Google Play billing test purchase + acknowledge
- Pending / cancel / network loss on device

## Guardrails shipped

- No purchase modal on cold start
- Web shows demo prices only
- Duplicate transaction IDs do not double-grant (tested)

If sandbox fails on TestFlight/Play Internal: disable store UI behind a flag before production submit — do not ship a broken checkout.
