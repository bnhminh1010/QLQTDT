export const DEFAULT_PARALLEL_GROUP_TITLE = "Nhánh song song";

const MOJIBAKE_PARALLEL_GROUP_TITLES = new Set([
  "NhÃ³m song song",
  "NhÃ¡nh song song",
  "NHÃNH SONG SONG",
  "NHÃM SONG SONG",
]);

export function normalizeParallelGroupTitle(title?: string | null) {
  const trimmed = title?.trim();
  if (!trimmed) return DEFAULT_PARALLEL_GROUP_TITLE;
  if (MOJIBAKE_PARALLEL_GROUP_TITLES.has(trimmed)) return DEFAULT_PARALLEL_GROUP_TITLE;
  return trimmed;
}
