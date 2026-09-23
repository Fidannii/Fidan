# RC Soak Test Report — 2026-09-22

## Scope

Automated, seeded simulation stress (no device soak in this environment).

## Runs

| Suite | Seeds | Ticks / seed | Result |
|-------|------:|-------------:|--------|
| `v3.foundation` stress | 1 | 1000 | PASS (prior) |
| `save.torture` accelerated | 1 | 800 (half tick) | PASS |
| `v3.foundation` RC soak | **10** | **400** (~100s sim eq.) | Added this pass |

100-seed / multi-hour wall-clock soak: **NOT_RUN** (CI time budget). Covered by device long-session script instead.

## Checked invariants

- cash / xp finite, cash ≥ 0
- level in [1, 100]
- congestion finite ≥ 0 when traffic present
- no intentional NaN injection accepted by migrate

## Not observed in automated runs

- Economy explosion requiring intervene
- Unlock deadlocks
- Event cascade without pause (events gated by sim clock)

## Gaps (external)

- Memory growth on mid-range Android / iOS
- 2h / 10h real play sessions
- Save file size growth over weeks of play
