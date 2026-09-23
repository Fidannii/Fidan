# 13 IAP / Billing Acceptance
Generated: 2026-09-23T07:38:31Z

## Gates
- IAP_ANDROID = **NOT_RUN** (sandbox) — code present
- IAP_IOS = **NOT_RUN** (sandbox) — code present

### Code inventory (not sandbox proof)
| Product ID | Type | Effect |
|------------|------|--------|
| com.fidani.metrobuilder.xp_small | Consumable | +200 XP |
| com.fidani.metrobuilder.xp_medium | Consumable | +800 XP |
| com.fidani.metrobuilder.xp_large | Consumable | +2500 XP |
| com.fidani.metrobuilder.level_up | Consumable | Instant level |

Unit: idempotent receipt grant PASS. Restore UI present. No cold-start purchase modal.

**Production submit must not proceed without sandbox PASS** — or disable IAP.
