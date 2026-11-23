export type AccentColor = "emerald" | "blue" | "violet" | "rose" | "amber";

export interface AccentPalette {
  id: AccentColor;
  label: string;
  light: string;
  dark: string;
  soft: string;
  softDark: string;
  secondaryLight: string;
  secondaryDark: string;
}

export const DEFAULT_ACCENT_COLOR: AccentColor = "emerald";

export const ACCENT_PALETTES: readonly AccentPalette[] = [
  {
    id: "emerald",
    label: "Emerald",
    light: "#059669",
    dark: "#34d399",
    soft: "#d1fae5",
    softDark: "rgba(52, 211, 153, 0.12)",
    secondaryLight: "#0d9488",
    secondaryDark: "#2dd4bf",
  },
  {
    id: "blue",
    label: "Blue",
    light: "#2563eb",
    dark: "#60a5fa",
    soft: "#dbeafe",
    softDark: "rgba(96, 165, 250, 0.12)",
    secondaryLight: "#0284c7",
    secondaryDark: "#38bdf8",
  },
  {
    id: "violet",
    label: "Violet",
    light: "#7c3aed",
    dark: "#a78bfa",
    soft: "#ede9fe",
    softDark: "rgba(167, 139, 250, 0.12)",
    secondaryLight: "#6d28d9",
    secondaryDark: "#c4b5fd",
  },
  {
    id: "rose",
    label: "Rose",
    light: "#e11d48",
    dark: "#fb7185",
    soft: "#ffe4e6",
    softDark: "rgba(251, 113, 133, 0.12)",
    secondaryLight: "#be123c",
    secondaryDark: "#fda4af",
  },
  {
    id: "amber",
    label: "Amber",
    light: "#d97706",
    dark: "#fbbf24",
    soft: "#fef3c7",
    softDark: "rgba(251, 191, 36, 0.12)",
    secondaryLight: "#b45309",
    secondaryDark: "#fcd34d",
  },
];

export function isAccentColor(value: unknown): value is AccentColor {
  return (
    typeof value === "string" &&
    ACCENT_PALETTES.some((palette) => palette.id === value)
  );
}

export function sanitizeAccentColor(value: unknown): AccentColor {
  return isAccentColor(value) ? value : DEFAULT_ACCENT_COLOR;
}

export function parseAccentSetting(
  raw: string | null | undefined,
): AccentColor {
  return typeof raw === "string"
    ? sanitizeAccentColor(raw.trim())
    : DEFAULT_ACCENT_COLOR;
}

export function accentPalette(value: unknown): AccentPalette {
  const id = sanitizeAccentColor(value);
  return ACCENT_PALETTES.find((palette) => palette.id === id) ?? ACCENT_PALETTES[0];
}
