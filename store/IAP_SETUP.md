# In-App-Käufe (Echtgeld) — App Store Connect

MetroBuilder verkauft **Consumable** IAP über StoreKit / Google Play  
(`cordova-plugin-purchase`). Soft-Credits bleiben parallel verfügbar.

## Produkt-IDs (exakt so anlegen)

| Product ID | Typ | Preis (Vorschlag) | Inhalt |
|---|---|---|---|
| `com.fidani.metrobuilder.xp_small` | Consumable | 0,99 € | +200 XP |
| `com.fidani.metrobuilder.xp_medium` | Consumable | 2,99 € | +800 XP |
| `com.fidani.metrobuilder.xp_large` | Consumable | 5,99 € | +2.500 XP |
| `com.fidani.metrobuilder.level_up` | Consumable | 1,99 € | 1× Sofort-Level |

## App Store Connect

1. App → **Monetization → In-App Purchases → Create**
2. Type: **Consumable**
3. Reference Name z. B. `XP Starter`
4. Product ID wie oben
5. Price Schedule setzen (Price Tier)
6. Localization DE/EN: Display Name + Description
7. Review Screenshot (Aufstieg-Tab mit IAP-Buttons)
8. Status → **Ready to Submit** (mit dem App-Build mitliefern)

## Xcode

1. Target **App** → **Signing & Capabilities**
2. **+ Capability** → **In-App Purchase**
3. Archive wie gewohnt

## Google Play (optional)

Dieselben Product IDs als **Managed product / Consumable** in Play Console anlegen.

## Sandbox testen

- iOS: Sandbox-Apple-ID unter Einstellungen → App Store
- Produkte müssen „Ready to Submit“ / „Waiting for Review“ sein
- Erstes Laden braucht Netzwerk

## Review-Notizen (Apple)

> In-App Purchases are consumable XP packs and a one-level boost.
> Open tab “Aufstieg” to see IAP buttons (Euro prices from StoreKit).
> Soft-currency credit packs remain available without real money.
> No subscriptions. No ads. No account.

## Privacy

`docs/privacy.html` erwähnt IAP — nach Merge GitHub Pages aktualisieren.
