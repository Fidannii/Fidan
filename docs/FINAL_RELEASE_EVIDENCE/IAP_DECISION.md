# IAP Decision — Store Completion

## Decision: **OPTION B — IAP_DISABLE_FOR_FIRST_RELEASE**

### Rationale (product reality)

- Real-money IAP exists in code (4 consumables) but is **not required** for core 3.0.0 progression.
- Soft-currency XP/level purchases remain.
- Apple/Google sandbox acceptance is **NOT_RUN** on real devices in this environment.
- Shipping an untested checkout would be a store/policy risk.

### Implementation (minimal)

- Flag: `src/iap/flags.ts` → `IAP_ENABLED_FOR_PRODUCTION = false`
- `initIap` short-circuits to `unavailable`
- Shop UI hides Echtgeld grid/restore; shows note; soft shop unchanged
- Architecture / product IDs retained for later enablement after sandbox PASS

### Status labels

| Platform | Status |
|----------|--------|
| IAP Android | **N/A** for this production build (disabled) |
| IAP iOS | **N/A** for this production build (disabled) |

To re-enable later: set flag `true`, bump build, run sandbox plans, re-test.
