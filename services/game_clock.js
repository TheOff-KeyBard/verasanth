// Fixed epoch — all players share the same in-game time.
// 4 real hours = 1 full game day cycle.
const EPOCH = new Date("2025-01-01T00:00:00Z").getTime();
const GAME_DAY_MS = 4 * 60 * 60 * 1000;

export function getGameTime() {
  const elapsed = (Date.now() - EPOCH) % GAME_DAY_MS;
  const hour = Math.floor((elapsed / GAME_DAY_MS) * 24);
  return { hour, period: hourToPeriod(hour) };
}

function hourToPeriod(hour) {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}
