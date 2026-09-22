# Dependency Security — npm audit (RC Harden)

**Date:** 2026-09-22  
**Command:** `npm audit`

## Summary counts

| Severity | Count |
|----------|------:|
| critical | 1 |
| high | 4 |
| moderate | 3 |
| low | 0 |

## Policy applied

- No blind major upgrades under feature freeze
- Prefer deferring **dev-only** transitive issues
- Production path must remain buildable (`npm ci` / `npm test` / `npm run build`)

## Classification (known)

| Issue area | Prod vs Dev | Action |
|------------|-------------|--------|
| `tar` via `@capacitor/assets` | **Dev** (icon/asset tooling) | **DEFERRED_POST_LAUNCH** — not in runtime bundle |
| Other high/moderate transitive | Mostly tooling | Review post-launch; no unsafe major bump this RC |

## After any future fix

```bash
npm ci && npm test && npm run build
```

## Verdict

**ACCEPT_WITH_DEFERRED_DEV_AUDITS** for RC1. No production runtime secret/vuln fix forced this pass.
