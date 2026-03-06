# Cursor Prompt — Rename NPC ID: alchemist → herbalist
# Paste this entire prompt into Cursor

---

Rename Thalara's NPC ID from `alchemist` to `herbalist` across both files.
This is a find-and-replace pass. Do not change anything else.

---

## index.js — 5 changes

**Line 23 — NPC_LOCATIONS:**
```
alchemist:   "hollow_jar",
```
→
```
herbalist:   "hollow_jar",
```

**Line 31 — NPC_NAMES:**
```
alchemist:   "Thalara",
```
→
```
herbalist:   "Thalara",
```

**Line 39 — NPC_TOPICS:**
```
alchemist:   ["sanctuary","board","dask","sewer","cistern","crawlers"],
```
→
```
herbalist:   ["sanctuary","board","dask","sewer","cistern","crawlers"],
```

**Line 187 — systemPrompts key and description text:**
```
alchemist: `You are Thalara, keeper of the Hollow Jar alchemist shop in Verasanth.
```
→
```
herbalist: `You are Thalara, keeper of the Hollow Jar in Verasanth — herbalist, healer, and collector of things the city would rather forget.
```

**Line 255 — BOARD_NPC_REACTIONS:**
```
alchemist:   "\"It posts what it needs to. Or what the city needs. Hard to tell the difference.\"",
```
→
```
herbalist:   "\"It posts what it needs to. Or what the city needs. Hard to tell the difference.\"",
```

---

## index.html — 1 change

**Line 1769 — NPC_NAMES:**
```
alchemist:   'Thalara',
```
→
```
herbalist:   'Thalara',
```

---

## Also update the fetch quest prompt (cursor_fetch_quest_prompt.md)

In the `QUEST_DEFS` object, both Thalara quest definitions:
```
npc: 'thalara',
```
→
```
npc: 'herbalist',
```

In the `npcQuestMap` object:
```
thalara:  ['thalara_q1', 'thalara_q2'],
```
→
```
herbalist: ['thalara_q1', 'thalara_q2'],
```

In the `VENDOR_NPCS` array:
```
'thalara'
```
→
```
'herbalist'
```

---

## Verification

After changes, confirm:
- [ ] Navigating to `hollow_jar` and inspecting `alchemist` object now uses `herbalist` as the NPC ID
- [ ] `/api/talk` with `{ npc: 'herbalist' }` routes to Thalara's system prompt
- [ ] `/api/data/npc/herbalist` returns her topic list
- [ ] No remaining references to `alchemist` as an NPC ID in either file
  (the word "alchemist" may still appear in descriptive text — that's fine,
   only the ID key needs to change)
