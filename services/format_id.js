/** Underscore id → Title Case words for UI (fallback when no curated label). */
export function formatId(str) {
  if (!str) return "";
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
