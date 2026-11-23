import {
  DEFAULT_ACCENT_COLOR,
  isAccentColor,
  type AccentColor,
} from "@/lib/finance/accent-color";
import {
  BASE_CURRENCY,
  isSupportedCurrency,
  type CurrencyCode,
} from "@/lib/finance/currency";

export type ThemePreference = "light" | "dark";

export interface UserSettings {
  displayName?: string;
  currency?: CurrencyCode;
  theme?: ThemePreference;
  accentColor?: AccentColor;
}

export interface UserSettingsUpdate {
  displayName: string;
  currency: CurrencyCode;
  theme: ThemePreference;
  accentColor: AccentColor;
}

export type UserMetadata = Record<string, unknown> | null | undefined;

const MAX_DISPLAY_NAME_LENGTH = 60;

export function normalizeDisplayName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0
    ? trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH)
    : undefined;
}

export function parseThemePreference(value: unknown): ThemePreference | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}

function parseCurrency(value: unknown): CurrencyCode | undefined {
  return typeof value === "string" && isSupportedCurrency(value)
    ? value
    : undefined;
}

export function settingsFromMetadata(metadata: UserMetadata): UserSettings {
  const settings: UserSettings = {};
  const displayName = normalizeDisplayName(metadata?.display_name);
  if (displayName) settings.displayName = displayName;

  const currency = parseCurrency(metadata?.currency);
  if (currency) settings.currency = currency;

  const theme = parseThemePreference(metadata?.theme);
  if (theme) settings.theme = theme;

  const accentColor = metadata?.accent_color;
  if (isAccentColor(accentColor)) settings.accentColor = accentColor;

  return settings;
}

export function settingsToMetadata(
  settings: UserSettingsUpdate,
): Record<string, string> {
  return {
    display_name: normalizeDisplayName(settings.displayName) ?? "",
    currency: parseCurrency(settings.currency) ?? BASE_CURRENCY,
    theme: parseThemePreference(settings.theme) ?? "light",
    accent_color: isAccentColor(settings.accentColor)
      ? settings.accentColor
      : DEFAULT_ACCENT_COLOR,
  };
}
