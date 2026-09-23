# IAP Release Decision (updated — Store Completion)

## Decision: **OPTION B — IAP_DISABLE_FOR_FIRST_RELEASE**

Real-money IAP UI/checkout is **gated off** via `IAP_ENABLED_FOR_PRODUCTION=false` until sandbox is evidenced.

- Soft-currency shop remains
- Product IDs / plugin wiring retained
- Build **13**

See `docs/FINAL_RELEASE_EVIDENCE/IAP_DECISION.md`.
