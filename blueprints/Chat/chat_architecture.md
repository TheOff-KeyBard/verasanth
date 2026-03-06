# Verasanth Chat System Architecture
**Version:** 1.0
**Status:** Design — pre-implementation

---

## OVERVIEW

Four channel types:
- **Global** — all players, persistent, scrollable history
- **Local** — players in the same location only, ephemeral feel
- **Whisper** — direct player to player, private
- **Noticeboard** — persistent player-written messages pinned to locations

Delivery method: **polling** (not WebSockets)
Cloudflare Workers do not support persistent WebSocket connections in the
standard model. We poll every 3-5 seconds for new messages. This is simple,
reliable, and sufficient for a text game pace.

---

## D1 SCHEMA

### Table: chat_messages
Stores global and local chat messages.

```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  channel     TEXT NOT NULL,        -- 'global' | 'local'
  location    TEXT,                 -- location key for local, NULL for global
  user_id     INTEGER NOT NULL,
  player_name TEXT NOT NULL,        -- denormalized for display speed
  message     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,     -- unix timestamp ms
  deleted     INTEGER DEFAULT 0     -- soft delete for moderation
);

CREATE INDEX idx_chat_channel ON chat_messages(channel, created_at DESC);
CREATE INDEX idx_chat_location ON chat_messages(location, created_at DESC);
```

### Table: whispers
Direct player-to-player messages.

```sql
CREATE TABLE IF NOT EXISTS whispers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id  INTEGER NOT NULL,
  from_name     TEXT NOT NULL,
  to_user_id    INTEGER NOT NULL,
  to_name       TEXT NOT NULL,
  message       TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  read          INTEGER DEFAULT 0   -- 0 unread, 1 read
);

CREATE INDEX idx_whisper_to ON whispers(to_user_id, created_at DESC);
CREATE INDEX idx_whisper_from ON whispers(from_user_id, created_at DESC);
```

### Table: noticeboards
Persistent player-written messages attached to locations.

```sql
CREATE TABLE IF NOT EXISTS noticeboards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  location    TEXT NOT NULL,
  user_id     INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  title       TEXT,                 -- optional short title
  message     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER,              -- NULL = permanent, or unix timestamp
  pinned      INTEGER DEFAULT 0,    -- admin can pin notices
  deleted     INTEGER DEFAULT 0
);

CREATE INDEX idx_noticeboard_location ON noticeboards(location, created_at DESC);
```

---

## API ENDPOINTS

### GET /api/chat/global?since=TIMESTAMP
Returns global messages newer than timestamp.
```json
{
  "messages": [
    {
      "id": 1,
      "player_name": "Damian",
      "message": "anyone been to the cistern yet",
      "created_at": 1234567890
    }
  ],
  "server_time": 1234567891
}
```

### GET /api/chat/local?since=TIMESTAMP
Returns local messages for the player's current location.
Auth required — uses player's current location from DB.
```json
{
  "messages": [...],
  "location": "tavern",
  "server_time": 1234567891
}
```

### POST /api/chat/send
```json
{
  "channel": "global" | "local",
  "message": "your message here"
}
```
Rate limited: max 1 message per 2 seconds per user.
Max message length: 280 characters.
Strips HTML, trims whitespace.

### POST /api/chat/whisper
```json
{
  "to_name": "Kelvaris",
  "message": "what do you know about dask"
}
```
Looks up `to_name` in players table (case-insensitive).
Returns error if player not found or not recently active.

### GET /api/chat/whispers?since=TIMESTAMP
Returns whispers sent TO the current player newer than timestamp.
Also returns unread count.

### GET /api/chat/noticeboard?location=tavern
Returns all active (non-deleted, non-expired) notices for a location.
```json
{
  "notices": [
    {
      "id": 1,
      "player_name": "Franklin",
      "title": "WARNING",
      "message": "DON'T GO DOWN. NOT WATER.",
      "created_at": 1234567890,
      "pinned": 0
    }
  ]
}
```

### POST /api/chat/noticeboard
```json
{
  "location": "tavern",
  "title": "optional title",
  "message": "your notice text",
  "expires_hours": 72   // optional, null = permanent
}
```
Max 1 notice per player per location at a time.
Max notice length: 500 characters.
Cost: 5 Ash Marks (deducted automatically — posting costs something)

### DELETE /api/chat/noticeboard/:id
Player can delete their own notices.
Admin can delete any notice.

---

## FRONTEND DESIGN

### Chat Panel Layout
The chat system lives in a collapsible panel at the bottom of the game screen.
Default state: collapsed, showing only an unread indicator if messages exist.

```
┌─────────────────────────────────────────┐
│ [Global] [Local] [Whispers]   ▲ collapse│
├─────────────────────────────────────────┤
│ Damian: anyone been to the cistern yet  │
│ Franklin: don't. seriously don't.       │
│ Mira: what's down there                 │
│ Franklin: I said don't                  │
├─────────────────────────────────────────┤
│ [input field]              [Send] [/w]  │
└─────────────────────────────────────────┘
```

### Tab behavior
- **Global**: shows last 50 messages, polls every 4 seconds
- **Local**: shows last 20 messages for current location, polls every 3 seconds, clears when player moves
- **Whispers**: shows inbox, polls every 5 seconds, unread count badge

### Whisper command
Players can whisper from the input field using `/w PlayerName message`
or by clicking a player name in chat (opens whisper mode).

### Noticeboard
Noticeboards appear as a **separate section** in rooms that have them —
not in the chat panel. Accessed via the existing INSPECT system:
- inspect noticeboard → shows all notices for this location
- A 'Post Notice' button appears (costs 5 Ash Marks)
- Modal with title (optional) and message fields

### Chat styling
- Global messages: `var(--text)` color, player name in `var(--gold)`
- Local messages: slightly warmer, player name in `var(--ember)`
- Whispers: italic, player name in muted purple `#9b7fa8`
- System messages (player entered/left location): muted ash, italic
- NPC "overheard" lines (rare flavor): italic, muted gold

---

## RATE LIMITING & MODERATION

### Rate limits
- Global chat: 1 message per 2 seconds, max 20 messages per minute
- Local chat: 1 message per 1 second, max 30 messages per minute
- Whispers: 1 per 3 seconds, max 10 per minute
- Noticeboard posts: 1 per location, max 3 total active notices

### Stored in D1 (check on each message):
```sql
SELECT COUNT(*) FROM chat_messages 
WHERE user_id = ? AND created_at > ? AND channel = ?
```

### Message sanitization
- Strip all HTML tags
- Strip markdown except *italics* (for flavor/roleplay)
- Max length enforced server-side
- Profanity filter: configurable word list in env variable (future)

### Admin moderation
- Admin panel gets new tab: Chat Moderation
- Can soft-delete any message (sets deleted=1, hidden from display)
- Can ban player from chat (new flag: `chat_banned`)
- Can pin/unpin noticeboard posts

---

## PRESENCE SYSTEM
(Simple — needed for whispers and local chat)

Track when players were last active so whispers know if a player exists.

### Add to existing sessions table or create:
```sql
-- Add column to existing players/sessions:
ALTER TABLE players ADD COLUMN last_seen INTEGER;
-- Update on every authenticated API call:
UPDATE players SET last_seen = unixepoch('now') * 1000 WHERE id = ?
```

"Recently active" = last_seen within 30 minutes.
Used by whisper system to validate target player exists and is playing.

---

## NOTICEBOARD THEMATIC DESIGN

This is the most Verasanth-specific feature. Design notes:

- Noticeboards exist in: tavern, market_square, sewer_entrance, sewer_upper
- Each location's noticeboard has a different physical description
- Player notices mix with NPC-seeded notices (the existing FLAVOR_NOTICES)
- The board at market_square is the Ember Post — already described as alive
- Player notices on the Ember Post feel like they're part of the city's memory

**Seeded NPC notices at game start** (already exist in FLAVOR_NOTICES):
- These display alongside player notices
- Marked `user_id = 0` (system) in the DB
- Never expire, never deletable by players

**The emergent gameplay:**
A new player reads the noticeboard and sees:
- "RATS ATE JORIN. DON'T BE JORIN." (NPC seed)
- "DON'T GO DOWN. NOT WATER." (player-written by someone who survived)
- "The second level has a dry route east of the channel." (player discovery)

They can't tell which ones are NPC flavor and which are real warnings.
That's the design. Keep it ambiguous.

---

## IMPLEMENTATION ORDER FOR CURSOR

1. D1 migrations (create tables)
2. Backend endpoints (global, local, send)
3. Frontend chat panel (global tab only first)
4. Add local tab
5. Add whisper system
6. Add noticeboard (inspect integration)
7. Admin moderation tab
8. Presence system
9. Rate limiting

Do NOT implement all at once. Start with global chat only,
confirm it works, then add layers.

---

## FUTURE EXPANSION

- **Party system**: small group chat channel, shared location visibility on map
- **NPC "overheard" lines**: Kelvaris occasionally says something to the room
  that all local players see — not directed at anyone
- **City events**: server-wide announcements when something significant happens
  (player reaches deep sewer first, a boss is defeated, etc.)
- **Chat history search**: players can search their whisper history
- **Email notifications**: when beta launches, whispers can trigger email

---
*Architecture version 1.0 — Verasanth Chat System*
