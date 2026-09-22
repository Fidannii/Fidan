# MetroBuilder

Städtebau-Simulation — **von der Kernschleife aufgebaut**.

## Kernschleife

1. Straßen bauen  
2. Holz produzieren  
3. Bretter verarbeiten  
4. Häuser upgraden  
5. Strom/Wasser halten → Zufriedenheit → Steuern  
6. Stadt erweitern  

## Spielen

```bash
npm install
npm run dev
```

PWA: im Browser „Zum Home-Bildschirm“ — iOS & Android.

## Architektur

```
src/core/     Typen, Katalog, Welt, Simulation (Tick)
src/render/   Canvas-View
src/main.ts   UI + Input
```

Gebäude im Kern: Straße, Wohnhaus, Holzfäller, Sägewerk, Kraftwerk, Wasserturm, Park.
