# 08 Save / Migration / Data Integrity
Generated: 2026-09-23T07:38:31Z

## Gate: SAVE_DATA_INTEGRITY = **PASS** (automated)

Evidence from freshly run suites: `save.test.ts`, `save.torture.test.ts`, `save.migration.test.ts`.

| Scenario | Result |
|----------|--------|
| New game save/load | PASS |
| Corrupt primary → backup/lastGood | PASS |
| backup2-only recovery | PASS |
| Never silent new-game while recovery exists | PASS |
| v5/v6/v7 → v8 migration DATA_LOSS=NO | PASS |
| NaN cash rejected | PASS |
| Multi-city persist | PASS |
| Bus/tax/traffic dirty persist | PASS |
| Friendly userMessage (no raw TypeError) | PASS |

### Device-only / NOT_RUN
App background mid-save on physical device; multi-hour save growth — **NOT_RUN** (no device in agent).
