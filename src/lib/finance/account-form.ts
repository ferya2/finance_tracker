import type { Account, AccountKind, NewAccount } from "@/types/account";
import { formatAmountInput, parseAmount } from "./format";

export interface AccountFormValues {
  name: string;
  kind: AccountKind;
  openingBalance: string;
  color: string;
}

export interface AccountErrors {
  name?: string;
  kind?: string;
  openingBalance?: string;
  color?: string;
}

export const MAX_ACCOUNT_NAME_LENGTH = 40;

export const ACCOUNT_KIND_OPTIONS: ReadonlyArray<{
  value: AccountKind;
  label: string;
}> = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "cash", label: "Cash" },
  { value: "credit", label: "Credit" },
];

export const ACCOUNT_COLOR_PALETTE: readonly string[] = [
  "#059669",
  "#0d9488",
  "#0284c7",
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#db2777",
  "#e11d48",
  "#d97706",
  "#65a30d",
];

const ACCOUNT_KINDS = new Set<string>(
  ACCOUNT_KIND_OPTIONS.map((option) => option.value),
);

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isValidAccountColor(color: string): boolean {
  return typeof color === "string" && HEX_COLOR_PATTERN.test(color);
}

export function accountKindLabel(kind: AccountKind): string {
  return (
    ACCOUNT_KIND_OPTIONS.find((option) => option.value === kind)?.label ??
    "Account"
  );
}

export function emptyAccountForm(
  color: string = ACCOUNT_COLOR_PALETTE[0],
): AccountFormValues {
  return { name: "", kind: "checking", openingBalance: "", color };
}

export function accountToFormValues(account: Account): AccountFormValues {
  return {
    name: account.name,
    kind: account.kind,
    openingBalance: formatAmountInput(account.openingBalance),
    color: account.color,
  };
}

export function toNewAccount(values: AccountFormValues): NewAccount {
  return {
    name: values.name.trim(),
    kind: values.kind,
    openingBalance: parseAmount(values.openingBalance) ?? 0,
    color: values.color,
  };
}

export function validateAccountForm(
  values: AccountFormValues,
): AccountErrors {
  const errors: AccountErrors = {};
  const name = values.name.trim();

  if (name.length === 0) {
    errors.name = "Name is required.";
  } else if (name.length > MAX_ACCOUNT_NAME_LENGTH) {
    errors.name = `Name must be at most ${MAX_ACCOUNT_NAME_LENGTH} characters.`;
  }

  if (!ACCOUNT_KINDS.has(values.kind)) {
    errors.kind = "Choose a valid account type.";
  }

  const openingBalance = parseAmount(values.openingBalance);
  if (openingBalance === null) {
    errors.openingBalance = "Opening balance must be a valid amount.";
  }

  if (!isValidAccountColor(values.color)) {
    errors.color = "Choose a valid colour.";
  }

  return errors;
}
