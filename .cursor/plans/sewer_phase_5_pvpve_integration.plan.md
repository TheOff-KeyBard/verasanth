---
name: Sewer Phase 5 PvPvE Integration
overview: "Implement Phase 5 of sewer_complete.md: PvPvE integration for Iron Walkway (ambush/escort choke), Drowned Vault (escort destination), and Ash Heart Chamber (group target)."
todos: []
isProject: false
---

# Sewer Complete Phase 5 — PvPvE Integration

## Scope

Phase 5 from [sewer_complete.md](c:\Users\Ethre\Downloads\sewer_complete.md):

1. **Iron Walkway** — contract/ambush choke point, fall_risk hazard
2. **Drowned Vault** — natural escort contract location
3. **Ash Heart Chamber** — high-value group target, group required

---

## Part 1 — PvPvE Metadata on Sewer Nodes

### data/sewer_nodes.js

Add `pvpve` object to the three zones:

- **iron_walkway**: `{ ambush_choke: true, escort_bottleneck: true, hazard: "fall_risk" }`
- **drowned_vault**: `{ escort_destination: true }`
- **ash_heart_chamber**: `{ group_target: true, group_required: true }`

These flags enable future contract UI and logic (escort contracts, ambush awareness).

---

## Part 2 — Iron Walkway fall_risk Hazard

### Blueprint

> hazard: fall_risk (knocked back in combat: fall damage 15, DEX check to catch chain)

### index.js — Combat Action

When combat occurs in `iron_walkway` and the enemy hits with damage ≥ 8:

1. Roll DEX check: d20 + DEX mod vs DC 12
2. **Fail**: +15 fall damage, narrative: *"The blow drives you toward the edge. You miss the chain — **15** fall damage."*
3. **Pass**: narrative: *"You catch the chain. The walkway holds."*

Apply fall damage before Victory/Death checks. Include fall narrative in victory, ongoing, and death messages when applicable.

---

## Part 3 — Ash Heart Chamber Group Warning

### index.js — Move API

When player moves to `ash_heart_chamber`:

1. Call `getPartyMembers(db, dbAll, uid)`
2. If `partyMembers.length === 0`: add `pvpve_warning: "The cathedral floor demanded more than one. The guardians have always known this."` to the move response

Entry is not blocked — solo is "exceptional circumstance only" per blueprint. The warning sets expectation.

---

## Part 4 — Location API PvPvE Fields

### index.js — GET /api/location and POST /api/move

Include `pvpve` in the response when the room has `room.pvpve`:

```javascript
if (room.pvpve) payload.pvpve = room.pvpve;
```

Frontend can use this for UI hints (e.g. "Ambush choke", "Escort destination", "Group target").

---

## Future Work (Out of Phase 5 Scope)

- Contract creation UI (Escort to Drowned Vault, etc.)
- Contract state tracking and breach consequences
- Noticeboard integration for contract types by zone
- Bounty/ambush mechanics when hostile players share location
