# MetroBuilder — App-Store Veröffentlichung

Diese Anleitung bringt dich von diesem Repo zum **App Store / Google Play** Upload.
Alles Nötige ist vorbereitet: Capacitor-App, Icons, Privacy, Bundle-ID.

## Voraussetzungen

### Apple App Store
1. [Apple Developer Program](https://developer.apple.com/programs/) (99 USD/Jahr)
2. Mac mit **Xcode 16+**
3. App-Store-Connect Zugang

### Google Play (optional parallel)
1. [Google Play Console](https://play.google.com/console) (einmalig 25 USD)
2. Android Studio

## Bundle / Package

| Feld | Wert |
|------|------|
| App-Name | MetroBuilder |
| Bundle ID (iOS) | `com.fidani.metrobuilder` |
| Application ID (Android) | `com.fidani.metrobuilder` |
| Version | `1.0.0` |
| Kategorie | Spiele → Simulation |
| Alter | 9+ (keine User-Chats) |
| Privacy-URL | `https://DEINE-DOMAIN/privacy.html` oder GitHub Pages |

> **Wichtig:** Bundle-ID in App Store Connect exakt so anlegen, sonst Signing-Fehler.

## Einmalig lokal auf dem Mac

```bash
git clone <dieses-repo>
cd Fidan
npm install
npm run icons
npm run cap:sync
```

### iOS

```bash
npx cap open ios
```

In Xcode:
1. Team unter **Signing & Capabilities** wählen
2. Bundle Identifier = `com.fidani.metrobuilder`
3. Display Name = MetroBuilder
4. Version `1.0.0`, Build `1`
5. Device = Any iOS Device (arm64)
6. **Product → Archive → Distribute App → App Store Connect**

Icons/Splash (empfohlen):

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --ios --android \
  --iconBackgroundColor '#050d12' \
  --splashBackgroundColor '#050d12'
npm run cap:sync
```

Quell-Icon liegt unter `resources/icon.png` (1024×1024).

### Android

```bash
npx cap open android
```

In Android Studio: Build → Generate Signed Bundle / APK → **Android App Bundle (.aab)**.

## App Store Connect — Listing (DE)

**Untertitel (30 Zeichen):** Städtebau-Simulation

**Beschreibung (Kurz):**
Baue aus einer leeren Fläche deine Metropole. Produziere Rohstoffe, upgrade Wohnungen, halte Strom & Wasser und steige im Level auf.

**Beschreibung (Lang):**
MetroBuilder ist eine Städtebau-Simulation:
• Produktionsketten (Holz → Bretter → Upgrades)
• Infrastruktur, Dienste, Spezialgebäude
• Handel, Club, Regionen, Katastrophen
• Level-Aufstieg mit Freischaltungen
• Offline spielbar — Fortschritt lokal gespeichert

Kernfortschritt ist ohne Zahlung erreichbar. Virtuelle Währungen dienen der Zeitersparnis.

**Keywords:** Städtebau,Simulation,Stadt,Bauen,Strategie,Idle,Wirtschaft,Metropole

**Support-URL:** https://github.com/Fidannii/Fidan  
**Marketing-URL:** optional  
**Privacy Policy URL:** muss öffentlich erreichbar sein (`public/privacy.html`)

## Screenshots (Pflicht)

Benötigt (iPhone):
- 6.7" (1290×2796) und/oder 6.5"
- Optional iPad 12.9"

Tipps aus dem Spiel:
1. Stadt-Ansicht mit Isometrie
2. Club mit Avataren
3. Level-up Popup
4. Handel / Regionen

Mit Simulator oder Gerät aufnehmen → in App Store Connect hochladen.

## Review-Hinweise (für Apple)

Review-Notizen vorschlagen:

> MetroBuilder is an offline city builder. No login. Progress is stored on-device. Tap through the intro, place roads, open the “Aufstieg” tab. Virtual currencies (Credits/Gems) are soft currency; no real-money IAP is enabled in 1.0.0.

## Was du noch selbst brauchst (nicht automatisierbar)

1. Apple Developer Account bezahlen
2. Privacy-URL öffentlich hosten (GitHub Pages / eigene Domain)
3. Screenshots aufnehmen
4. In Xcode mit deinem Team signieren & hochladen
5. Altersfreigabe / Content Rights in Connect ausfüllen

Danach: **Nur noch „Zur Prüfung einreichen“ in App Store Connect.**

## Befehle-Kurzüberblick

```bash
npm install
npm run build
npx cap sync
npx cap open ios      # Mac + Xcode
npx cap open android  # Android Studio
```
