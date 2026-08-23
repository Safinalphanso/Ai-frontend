/** Same rules as backend/src/splitMessages.js */
export function splitMessages(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];

  const hasBlankLine = /\n\s*\n/.test(raw);
  const parts = hasBlankLine
    ? raw.split(/\n\s*\n+/)
    : raw.split(/\n/);

  return parts.map((p) => p.trim()).filter(Boolean);
}

export const MAX_BATCH = 100;
