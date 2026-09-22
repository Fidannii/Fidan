# MetroBuilder — V3 Changelog (2026-09-22)

## From 2.0.0 / Save v7 → 3.0.0-candidate / Save v8

### Foundation
- Seeded RNG + SimulationClock + GameSpeed (pause/1x/2x/4x)
- Gameplay command layer (`src/game/commands`)
- App bootstrap helper
- Save v8 migration (seed, clock, tax, bus, delayed events)
- Expanded automated tests 33 → 52

### Simulation
- Tax rate with happiness trade-off
- Cashflow breakdown: roads / services / transport / buildings
- House growth/decay hysteresis
- Traffic graph routing + congestion coupling to happiness/productivity
- Bus line vertical slice
- Events V2: weighted seeded spawn, cooldowns, delayed follow-ups

### UX / copy
- Tax + speed controls in Stadt panel
- Bus line auto-create button
- Cloud stub wording corrected
- Store-ready claims softened to “Store-Submission vorbereitet”

### Explicitly not done
- Native Android/iOS signed builds
- Real cloud backend
- Full main.ts panel extraction
- Tram/Metro
