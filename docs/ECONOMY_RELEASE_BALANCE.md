# Economy Release Balance — RC Notes

## Goal

Prevent instant wealth, irreparable bankruptcy, and meaningless systems — not perfect balance.

## Automated / structural checks

- Cash clamped ≥ 0 on migrate; NaN rejected
- Tax rate bounded [0.5, 1.5]
- Building/upkeep/services affect sim via city systems
- Traffic congestion feeds pressure (overlay + blurb)
- Soft currency earnable; IAP optional only

## Strategy smoke (manual / device preferred)

| Strategy | Expectation | Status |
|----------|-------------|--------|
| Conservative | Slow growth, stable cash | DESIGN_OK / device NOT_RUN |
| Balanced | Default path | DESIGN_OK |
| Aggressive growth | Cash pressure + traffic | DESIGN_OK |
| High tax | Growth trade-off | DESIGN_OK (rate cap) |
| Low tax | Budget pressure | DESIGN_OK |
| Industry heavy | Job/housing imbalance risk | DESIGN_OK |
| Residential heavy | Job shortage risk | DESIGN_OK |
| Traffic neglect | Congestion visible | DESIGN_OK |

## Verdict

**ACCEPTABLE_FOR_RC** — fine-tune deferred (`P2-04`).
