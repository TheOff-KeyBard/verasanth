export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
  ALLOWED_ORIGINS?: string;
}
