# Echtgeld-IAP: Apple App Store + Google Play

MetroBuilder nutzt **einen Code** (`cordova-plugin-purchase`) für beide Stores:

| Gerät | Zahlungsanbieter | Technik |
|-------|------------------|---------|
| iPhone / iPad | **Apple App Store** | StoreKit (Apple-ID / iCloud-Konto) |
| Android | **Google Play** | Play Billing Library 7.x |

> „iCloud App Store“ = Käufe laufen über die **Apple-ID** (dieselbe wie iCloud).  
> Es gibt keinen separaten iCloud-Payment-Provider — Restore nutzt die Apple-ID.

Soft-Credits bleiben parallel (ohne Echtgeld).

---

## Produkt-IDs (identisch in beiden Stores)

| Product ID | Typ | Preis-Vorschlag | Inhalt |
|---|---|---|---|
| `com.fidani.metrobuilder.xp_small` | Consumable | 0,99 € | +200 XP |
| `com.fidani.metrobuilder.xp_medium` | Consumable | 2,99 € | +800 XP |
| `com.fidani.metrobuilder.xp_large` | Consumable | 5,99 € | +2.500 XP |
| `com.fidani.metrobuilder.level_up` | Consumable | 1,99 € | 1× Sofort-Level |

IDs müssen **zeichengenau** gleich sein.

---

## 1) Apple App Store (iOS)

### App Store Connect
1. App mit Bundle ID `com.fidani.metrobuilder`
2. **Monetization → In-App Purchases → Create**
3. Type: **Consumable**
4. Product ID wie oben
5. Price Schedule + DE/EN Localizations
6. Review-Screenshot (Tab „Aufstieg“)
7. Status: **Ready to Submit** (mit App-Version mitschicken)

### Xcode
1. Target **App** → **Signing & Capabilities**
2. **+ Capability** → **In-App Purchase**
3. Team wählen, Archive → App Store Connect

### Sandbox-Test
1. iPhone: Einstellungen → App Store → Sandbox-Apple-ID
2. App aus Xcode auf Gerät installieren (nicht TestFlight-Sandbox vermischen)
3. Im Tab **Aufstieg** IAP tippen → StoreKit-Dialog

### Restore / Apple-ID
Button **Käufe wiederherstellen** ruft `restorePurchases()` auf und bindet an die Apple-ID  
(iCloud-Konto des Geräts). Consumables werden typischerweise nicht erneut gutgeschrieben —  
der Button ist für Review & Account-Sync trotzdem Pflicht-UX.

---

## 2) Google Play Store (Android)

### Play Console
1. App mit Application ID `com.fidani.metrobuilder`
2. **Monetize → Products → In-app products → Create product**
3. Product ID wie oben, Type **Consumable** (Managed product, einmalig verbrauchbar)
4. Name, Beschreibung, Preis (EUR)
5. **Activate**
6. App muss mindestens einmal als **Internal testing** / Closed testing hochgeladen sein,  
   sonst liefert Billing oft keine Produkte

### Lizenztester
1. Play Console → Settings → **License testing**
2. Gmail-Accounts der Tester eintragen
3. Auf dem Gerät mit diesem Google-Konto in den Play Store einloggen
4. Test-Track-Link öffnen / App installieren

### Android Studio / Build
```bash
npm run cap:sync
npx cap open android
# Build → Generate Signed Bundle (.aab) → Play Console hochladen
```

Manifest enthält bereits `com.android.vending.BILLING`.  
Billing Client: `com.android.billingclient:billing:7.1.1` (via Plugin).

---

## 3) Im Code (bereits verdrahtet)

- iOS → `Platform.APPLE_APPSTORE`
- Android → `Platform.GOOGLE_PLAY`
- Nach Kauf: `transaction.finish()` (Apple finish / Google consume)
- UI zeigt aktiven Store: „Apple App Store“ oder „Google Play“

```bash
npm run cap:sync
```

---

## Review-Notizen (Apple)

> Payments use Apple In-App Purchase (StoreKit).  
> Open tab “Aufstieg” for consumable XP packs and Sofort-Level.  
> Soft-currency credit packs remain available without real money.  
> Restore uses the device Apple ID. No subscriptions. No ads. No login.

## Review-Notizen (Google)

> Billing via Google Play Billing Library.  
> Same product IDs as listed in the store listing.  
> Test with license tester accounts on an internal testing track.

---

## Checkliste vor Submit

### Apple
- [ ] 4 Consumables in App Store Connect
- [ ] Xcode Capability **In-App Purchase**
- [ ] Sandbox-Kauf OK
- [ ] Privacy URL live (`docs/privacy.html`)

### Google
- [ ] 4 In-app products aktiv
- [ ] AAB in Internal testing
- [ ] License tester Kauf OK
- [ ] Gleiche Product IDs wie Apple
