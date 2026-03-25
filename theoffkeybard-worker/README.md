# theoffkeybard-worker

Cloudflare Worker API for Verasanth Phase 1 (`/api/*` only). D1 binding: `DB`.

## Setup

1. `npm install`
2. `wrangler d1 create verasanth` — copy `database_id` into `wrangler.toml`.
3. Copy `.dev.vars.example` to `.dev.vars` and set `SESSION_SECRET`.
4. `npx wrangler d1 migrations apply verasanth --local` (or `--remote` after DB exists).
5. `npm run dev` — API at `http://127.0.0.1:8787` (default).

## Deploy

`npm run deploy` — set `SESSION_SECRET` in the Worker environment in the dashboard.

## Deviations from Website Bible §27–33

The Website Bible file was not in this repository. Implemented:

- **§30 tables**: All five names (`players`, `inventory`, `world_state`, `flags`, `encounters`) with columns chosen to support §31 endpoints (e.g. `passphrase_salt` + `passphrase_hash`, `equipped_json`, encounter stats + `log_json`).
- **§29 combat**: Simple d20 vs AC, damage 1d4+level, flee d20≥12, enemy counterattack — replace when official spec is available.

Point `ALLOWED_ORIGINS` in `wrangler.toml` at your Next.js origin(s).
