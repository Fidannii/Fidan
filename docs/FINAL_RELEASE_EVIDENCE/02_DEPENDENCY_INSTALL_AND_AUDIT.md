# 02 Dependency Install and Audit
Generated: 2026-09-23T07:38:02Z

## Gate: CLEAN_NPM_CI = **PASS**

| Item | Value |
|------|-------|
| node | v22.14.0 |
| npm | 10.9.7 |
| command | `npm ci` |
| exit | **0** |
| packages | 623 added / 624 audited |
| vitest | 5.0.1 present |

Log: `02_npm_ci.log`

## npm audit

| Severity | Count |
|----------|------:|
| critical | 1 |
| high | 4 |
| moderate | 3 |
| low | 0 |

### Classification

| Finding | Prod runtime? | Action |
|---------|---------------|--------|
| tar (via @capacitor/cli / assets path) | **No** — tooling | DEFERRED_POST_LAUNCH; no blind major upgrade under freeze |
| @capacitor/assets / sharp | **No** — icon tooling | DEFERRED |
| playwright | **No** — screenshot/dev | DEFERRED |
| @capacitor/cli | **No** — CLI only | DEFERRED |

No code changes applied solely to silence audit.
