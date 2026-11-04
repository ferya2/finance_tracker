import { describe, expect, it } from "vitest";
import type { Account } from "@/types/account";
import {
  ACCOUNT_COLOR_PALETTE,
  accountKindLabel,
  accountToFormValues,
  emptyAccountForm,
  isValidAccountColor,
  toNewAccount,
  validateAccountForm,
  type AccountFormValues,
} from "./account-form";

const ACCOUNT: Account = {
  id: "acc-1",
  name: "Everyday checking",
  kind: "checking",
  openingBalance: 250000,
  color: "#059669",
};

function values(patch: Partial<AccountFormValues> = {}): AccountFormValues {
  return {
    name: "Cash wallet",
    kind: "cash",
    openingBalance: "125.50",
    color: ACCOUNT_COLOR_PALETTE[0],
    ...patch,
  };
}

describe("isValidAccountColor", () => {
  it("accepts six-digit hex colours", () => {
    expect(isValidAccountColor("#059669")).toBe(true);
    expect(isValidAccountColor("#ABCDEF")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidAccountColor("059669")).toBe(false);
    expect(isValidAccountColor("#fff")).toBe(false);
    expect(isValidAccountColor("green")).toBe(false);
  });
});

describe("accountKindLabel", () => {
  it("labels every known account kind", () => {
    expect(accountKindLabel("checking")).toBe("Checking");
    expect(accountKindLabel("savings")).toBe("Savings");
    expect(accountKindLabel("cash")).toBe("Cash");
    expect(accountKindLabel("credit")).toBe("Credit");
  });

  it("falls back for an unknown kind", () => {
    expect(accountKindLabel("other" as unknown as Account["kind"])).toBe(
      "Account",
    );
  });
});

describe("emptyAccountForm", () => {
  it("starts with no name, a checking account and the first colour", () => {
    expect(emptyAccountForm()).toEqual({
      name: "",
      kind: "checking",
      openingBalance: "",
      color: ACCOUNT_COLOR_PALETTE[0],
    });
  });

  it("accepts a custom default colour", () => {
    expect(emptyAccountForm("#2563eb").color).toBe("#2563eb");
  });
});

describe("accountToFormValues", () => {
  it("prefills an edit form and formats the opening balance", () => {
    expect(accountToFormValues(ACCOUNT)).toEqual({
      name: "Everyday checking",
      kind: "checking",
      openingBalance: "2500",
      color: "#059669",
    });
  });

  it("keeps cents that matter", () => {
    expect(
      accountToFormValues({ ...ACCOUNT, openingBalance: 5 }).openingBalance,
    ).toBe("0.05");
  });
});

describe("toNewAccount", () => {
  it("trims the name and parses the opening balance into cents", () => {
    expect(toNewAccount(values({ name: "  Cash wallet  " }))).toEqual({
      name: "Cash wallet",
      kind: "cash",
      openingBalance: 12550,
      color: ACCOUNT_COLOR_PALETTE[0],
    });
  });

  it("falls back to zero when the amount cannot be parsed", () => {
    expect(toNewAccount(values({ openingBalance: "nope" })).openingBalance).toBe(
      0,
    );
  });
});

describe("validateAccountForm", () => {
  it("accepts a complete form", () => {
    expect(validateAccountForm(values())).toEqual({});
  });

  it("requires a name and caps its length", () => {
    expect(validateAccountForm(values({ name: "   " })).name).toBe(
      "Name is required.",
    );
    expect(
      validateAccountForm(values({ name: "x".repeat(41) })).name,
    ).toContain("at most 40");
  });

  it("rejects an unknown kind", () => {
    expect(
      validateAccountForm(
        values({ kind: "other" as unknown as AccountFormValues["kind"] }),
      ).kind,
    ).toBe("Choose a valid account type.");
  });

  it("requires a parseable opening balance", () => {
    expect(
      validateAccountForm(values({ openingBalance: "" })).openingBalance,
    ).toBe("Opening balance must be a valid amount.");
    expect(
      validateAccountForm(values({ openingBalance: "abc" })).openingBalance,
    ).toBe("Opening balance must be a valid amount.");
  });

  it("allows zero and negative opening balances", () => {
    expect(validateAccountForm(values({ openingBalance: "0" }))).toEqual({});
    expect(validateAccountForm(values({ openingBalance: "-25.00" }))).toEqual(
      {},
    );
  });

  it("rejects an invalid colour", () => {
    expect(validateAccountForm(values({ color: "green" })).color).toBe(
      "Choose a valid colour.",
    );
  });
});
