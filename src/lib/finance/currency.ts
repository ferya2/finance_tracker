import { formatCurrency } from "./format";

/** A currency the app can display amounts in. */
export interface CurrencyOption {
  /** ISO 4217 currency code, e.g. `"USD"`. */
  code: string;
  /** Human-readable name, e.g. `"Euro"`. */
  name: string;
  /** Short symbol, e.g. `"€"`. */
  symbol: string;
}

/** Every currency offered in the app, in the order they should be listed. */
export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
] as const satisfies readonly CurrencyOption[];

/** A supported ISO currency code. */
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

/** The currency all stored amounts are kept in. */
export const BASE_CURRENCY: CurrencyCode = "USD";

/**
 * Exchange rates expressed as units of a currency per one US dollar (the base
 * currency). They are reference display rates only — not live quotes — and are
 * passed into the conversion helpers so the maths stays pure and testable.
 */
export type ExchangeRates = Readonly<Record<string, number>>;

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 147,
  IDR: 15_800,
};

const CURRENCY_BY_CODE = new Map<string, CurrencyOption>(
  SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency]),
);

/** True when `code` is one of the currencies the app supports. */
export function isSupportedCurrency(code: string): code is CurrencyCode {
  return CURRENCY_BY_CODE.has(code);
}

/** The display details for a currency code, or `null` when it is unknown. */
export function currencyInfo(code: string): CurrencyOption | null {
  return CURRENCY_BY_CODE.get(code) ?? null;
}

function validRate(code: string, rates: ExchangeRates): number | null {
  if (!isSupportedCurrency(code)) return null;
  const rate = rates[code];
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0
    ? rate
    : null;
}

/**
 * Convert an integer amount in one currency's minor units (cents) to another,
 * using rates relative to the base currency. The result is rounded to whole
 * cents. Returns `null` when the amount is not finite, either currency is
 * unsupported, or a rate is missing or invalid.
 */
export function convertCurrency(
  cents: number,
  from: string,
  to: string,
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES,
): number | null {
  if (!Number.isFinite(cents)) return null;

  const fromRate = validRate(from, rates);
  const toRate = validRate(to, rates);
  if (fromRate === null || toRate === null) return null;

  return Math.round((cents * toRate) / fromRate);
}

export interface FormatConversionOptions {
  rates?: ExchangeRates;
  locale?: string;
}

/**
 * Format an amount converted into another currency, e.g. 10000 USD cents with
 * the default rates becomes `"€92.00"`. Returns `null` when conversion fails.
 */
export function formatConvertedAmount(
  cents: number,
  from: string,
  to: string,
  options: FormatConversionOptions = {},
): string | null {
  const converted = convertCurrency(
    cents,
    from,
    to,
    options.rates ?? DEFAULT_EXCHANGE_RATES,
  );
  if (converted === null) return null;

  return formatCurrency(converted, to, options.locale);
}

/**
 * A side-by-side display of an amount and its conversion, e.g.
 * `"$100.00 ≈ €92.00"`. When the currencies match only the single formatted
 * amount is returned. Returns `null` when conversion fails.
 */
export function conversionLabel(
  cents: number,
  from: string,
  to: string,
  options: FormatConversionOptions = {},
): string | null {
  const converted = formatConvertedAmount(cents, from, to, options);
  if (converted === null) return null;

  if (from === to) return converted;

  return `${formatCurrency(cents, from, options.locale)} ≈ ${converted}`;
}
