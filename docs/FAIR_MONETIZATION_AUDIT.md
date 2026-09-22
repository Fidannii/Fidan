# Fair Monetization Audit — MetroBuilder

## Verdict: **Fair for RC** (no known dark patterns in code path)

## Checked systems

| System | Finding |
|--------|---------|
| Cold start | No purchase modal |
| Tutorial | No IAP push in early steps |
| Daily reward | Soft streak bonus; no buy-to-recover streak |
| Events | Choices cost soft currency or skip; not paywalled |
| Soft currency | Earnable in play |
| IAP | Optional XP / instant level consumables |
| Fake countdown / scarcity | Not found |
| Loot boxes / RNG paid rewards | Not found |
| Artificial blockers requiring pay | Not found |

## Allowed offers (present)

- Clear product titles / blurbs
- Store price when plugin ready; fallback shown
- Core progression reachable without payment

## Rules for RC

- Do not add aggressive IAP prompts before submit
- If sandbox fails → `IAP_DISABLE_RC1` rather than broken checkout
