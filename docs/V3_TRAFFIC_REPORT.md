# MetroBuilder — V3 Traffic Report

## Status: Traffic V2 **implemented** (graph + routing), legacy aggregate **retained**

### Legacy (`traffic.ts`)

- Global volume/capacity/congestion snapshot
- Still written each tick for UI compatibility

### V2 (`trafficGraph.ts`)

| Piece | Status |
|-------|--------|
| RoadNode / RoadEdge | PASS (code + tests) |
| Graph from cells | PASS |
| Aggregated trip groups | PASS (home→job, home→shop) |
| Dijkstra weighted by time×(1+cong) | PASS |
| Route cache + dirty flag | PASS |
| Edge load / congestion | PASS |
| Bus ridership relief | PASS (via `g.busRidership`) |
| Overlay uses edge congestion when present | PASS |

### Bus vertical slice (`bus.ts`)

| Requirement | Status |
|-------------|--------|
| Depot required | PASS |
| ≥2 stops (station/depot) | PASS |
| Capacity × frequency | PASS |
| Operating cost | PASS |
| Ridership tick | PASS |
| Traffic demand reduction | PASS |
| Save fields | PASS (`busLines` in v8) |

### Not in this pass

- Per-citizen agents
- Tram/Metro/Rail
- Live vehicle path sprites tied to graph edges (vehicles remain visual abstraction)
