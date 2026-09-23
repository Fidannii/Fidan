# Privacy Data Map — MetroBuilder 3.0.0

| Data | Collected? | Where | Shared? | Purpose |
|------|------------|-------|---------|---------|
| Game save (progress, inventory, settings) | Yes | On-device localStorage / app sandbox | No | Gameplay |
| IAP receipt IDs | Yes (local) | `iapReceipts` in save | No (store handles payment) | Idempotent grants |
| Analytics / advertising ID | **No** | — | — | — |
| Account / email in app | **No** | — | — | — |
| Location / contacts / photos / mic / camera | **No** | — | — | — |
| Crash telemetry SDK | **No** | — | — | — |
| Payment card data | **No** | Handled by Apple/Google only | — | — |

## Alignment

- PrivacyInfo.xcprivacy: tracking **false**, no collected data types declared
- Android: INTERNET + BILLING only
- Privacy HTML updated to 3.0.x wording

## Unknown / external

- Store platforms may process purchase metadata under their policies (Apple/Google) — not under app code control
