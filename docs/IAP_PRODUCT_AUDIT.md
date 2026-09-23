# IAP Product Audit — Submission Prep

## Decision: **IAP_SHIP** (production gated on sandbox)

Code + restore UX present. Device sandbox: **NOT_RUN**.  
If sandbox fails before production submit → switch to **IAP_DISABLE_FOR_FIRST_RELEASE**.

| PRODUCT_ID | TYPE | PRICE_TIER (suggest) | CONTENT | CONSUMABLE? | RESTORABLE? | GAMEPLAY_EFFECT |
|------------|------|----------------------|---------|-------------|-------------|-----------------|
| `com.fidani.metrobuilder.xp_small` | Consumable | ~0,99 € | +200 XP | Yes | Typically no | XP grant |
| `com.fidani.metrobuilder.xp_medium` | Consumable | ~2,99 € | +800 XP | Yes | Typically no | XP grant |
| `com.fidani.metrobuilder.xp_large` | Consumable | ~5,99 € | +2500 XP | Yes | Typically no | XP grant |
| `com.fidani.metrobuilder.level_up` | Consumable | ~1,99 € | Instant level | Yes | Typically no | Level-up |

## Guardrails verified in code
- No cold-start purchase modal
- Idempotent receipt IDs (unit-tested)
- Restore button visible in shop
- Core progression without purchase

## External required
Apple Sandbox + Google License tester plans in `docs/APPLE_SANDBOX_TEST_PLAN.md` / `docs/GOOGLE_BILLING_TEST_PLAN.md`
