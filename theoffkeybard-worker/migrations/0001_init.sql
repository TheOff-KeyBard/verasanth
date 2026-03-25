-- Verasanth Phase 1 — five core tables (Website Bible §30 naming; columns per Phase 1 API needs).
-- Deviations flagged in worker README if Bible differs.

CREATE TABLE players (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  passphrase_salt TEXT NOT NULL,
  passphrase_hash TEXT NOT NULL,
  current_node TEXT NOT NULL,
  hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  level INTEGER NOT NULL,
  xp INTEGER NOT NULL,
  equipped_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE (player_id, item_id)
);

CREATE INDEX idx_inventory_player ON inventory(player_id);

CREATE TABLE world_state (
  player_id TEXT NOT NULL,
  state_key TEXT NOT NULL,
  state_value TEXT NOT NULL,
  PRIMARY KEY (player_id, state_key),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE flags (
  player_id TEXT NOT NULL,
  flag_key TEXT NOT NULL,
  flag_value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, flag_key),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE encounters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL UNIQUE,
  enemy_id TEXT NOT NULL,
  enemy_hp INTEGER NOT NULL,
  enemy_max_hp INTEGER NOT NULL,
  enemy_attack INTEGER NOT NULL,
  enemy_defense INTEGER NOT NULL,
  turn_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  log_json TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX idx_encounters_player ON encounters(player_id);
