# Google Play Billing Test Plan — MetroBuilder IAP

**Status:** PREP only — no automatic real purchases.

## Prerequisites (external)

- [ ] Play Console app `com.fidani.metrobuilder`
- [ ] License testers / internal track
- [ ] Signed AAB with BILLING permission
- [ ] Products matching `store/IAP_SETUP.md`

## Cases

| ID | Case | Expected |
|----|------|----------|
| G1 | Purchase success | Grant once; acknowledge |
| G2 | Cancel | No grant |
| G3 | Pending | Wait; no premature grant |
| G4 | Network loss | Friendly message; no crash |
| G5 | Duplicate | Idempotent grant |
| G6 | App kill mid-flow | Safe resume |
| G7 | Offline open shop | Clear “no network / store unavailable” |
| G8 | Restore / query purchases | Consistent with product type |

## Pass criteria for `IAP_SHIP`

G1–G8 on a physical Android device via Internal testing.

Failure → **IAP_DISABLE_RC1** before production.
