import {
  BASE_CURRENCY,
  isSupportedCurrency,
  type CurrencyCode,
} from "./currency";

/** The currency used until the user picks another one. */
export const DEFAULT_CURRENCY_CODE: CurrencyCode = BASE_CURRENCY;

/**
 * Coerce an unknown value into a supported currency code, falling back to the
 * default. Used wherever a stored or user-supplied value could be anything.
 */
export function sanitizeCurrencyCode(value: unknown): CurrencyCode {
  return typeof value === "string" && isSupportedCurrency(value)
    ? value
    : DEFAULT_CURRENCY_CODE;
}

/**
 * Read a currency code from a stored string. Empty, malformed or unsupported
 * values fall back to the default so a bad setting never breaks formatting.
 */
export function parseCurrencySetting(
  raw: string | null | undefined,
): CurrencyCode {
  if (!raw) return DEFAULT_CURRENCY_CODE;
  return sanitizeCurrencyCode(raw.trim());
}
