# Apple Sandbox Test Plan — MetroBuilder IAP

**Status:** PREP only — no live sandbox purchases in this environment.

## Prerequisites (external)

- [ ] Apple Developer account
- [ ] App Store Connect app `com.fidani.metrobuilder`
- [ ] Sandbox tester account
- [ ] Products created per `store/IAP_SETUP.md`
- [ ] TestFlight or Xcode signed build with StoreKit

## Cases

| ID | Case | Expected |
|----|------|----------|
| A1 | Purchase success | Grant once; receipt stored; UI confirms |
| A2 | User cancel | No grant; no error spam |
| A3 | Pending / Ask to Buy | No grant until cleared |
| A4 | Restore | No double-grant; consumables typically unrestorable — document behavior |
| A5 | Network loss mid-purchase | Friendly message; no crash |
| A6 | Duplicate transaction ID | Idempotent — no second grant |
| A7 | Kill app during purchase | Resume safe; no corrupt save |
| A8 | Resume after background | Store plugin still usable |

## Pass criteria for `IAP_SHIP`

All A1–A8 on at least one iPhone physical device.

If any fail with broken checkout UX → switch to **IAP_DISABLE_RC1** before production submit.
