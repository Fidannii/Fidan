# Bus System Release Decision

## Decision: **SHIP**

## Criteria check

| Criterion | Status |
|-----------|--------|
| Line creation works | PASS (unit) |
| Save/load | PASS (torture) |
| UI discoverable | PASS (Traffic panel + copy) |
| Crashes known | None in automated suite |
| Traffic effect | Ridership reduces auto demand |
| Operating cost | `tickBus` applies cost |
| Stops | Depot + ≥2 stops required |
| Half-finished button | No — gated behind valid stops |

## Note

Not a full metro system — vertical slice only. Expand post-launch if metrics justify (v3.2 / v4 backlog).
