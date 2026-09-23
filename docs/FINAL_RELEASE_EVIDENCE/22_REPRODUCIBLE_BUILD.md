# 22 Reproducible Build
Generated: 2026-09-23T07:38:31Z

## Result: **PASS** for web dist content hashes (A vs clean-room B)

Compared selected production assets after independent `npm ci` + `npm run build`:

| File | Match |
|------|-------|
| assets/index-pr_n0zma.js | identical SHA256 |
| assets/index-bVEHPS4t.css | identical SHA256 |
| index.html | identical SHA256 |

AAB signing/timestamps: not byte-deterministic expected; unsigned AAB produced once.
Native AAB reproducibility: N/A without production signing.

See `23_clean_room.txt`.
