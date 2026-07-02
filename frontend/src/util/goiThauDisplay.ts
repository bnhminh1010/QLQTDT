export const GOI_THAU_DISPLAY_DASH = "—";

export function normalizeGoiThauDisplayValue(value?: string | null): string {
  const normalized = value?.trim();
  return normalized ? normalized : GOI_THAU_DISPLAY_DASH;
}

export function resolveGoiThauNguonVon(
  ...values: Array<string | null | undefined>
): string {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) return normalized;
  }

  return GOI_THAU_DISPLAY_DASH;
}
