import { describe, expect, it } from "vitest";
import type { NewTransfer, Transfer } from "@/types/transfer";
import {
  emptyTransferForm,
  isTransfer,
  MAX_TRANSFER_NOTE_LENGTH,
  sanitizeTransfers,
  toNewTransfer,
  validateTransferForm,
  validateTransferInput,
  type TransferFormValues,
} from "./transfer-form";

const ACCOUNT_IDS = ["acc-checking", "acc-savings", "acc-cash"];

const TRANSFER: Transfer = {
  id: "tr-1",
  fromAccountId: "acc-checking",
  toAccountId: "acc-savings",
  amount: 50000,
  note: "Monthly saving",
  occurredOn: "2026-09-01",
};

function values(patch: Partial<TransferFormValues> = {}): TransferFormValues {
  return {
    fromAccountId: "acc-checking",
    toAccountId: "acc-savings",
    amount: "500.00",
    note: "",
    occurredOn: "2026-09-01",
    ...patch,
  };
}

function input(patch: Partial<NewTransfer> = {}): NewTransfer {
  return {
    fromAccountId: "acc-checking",
    toAccountId: "acc-savings",
    amount: 50000,
    occurredOn: "2026-09-01",
    ...patch,
  };
}

describe("emptyTransferForm", () => {
  it("starts empty on the given day", () => {
    expect(emptyTransferForm("2026-09-10")).toEqual({
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      note: "",
      occurredOn: "2026-09-10",
    });
  });
});

describe("toNewTransfer", () => {
  it("trims fields, parses cents and drops an empty note", () => {
    expect(
      toNewTransfer(
        values({
          fromAccountId: " acc-checking ",
          toAccountId: " acc-savings ",
          amount: "1,234.56",
          note: "   ",
        }),
      ),
    ).toEqual({
      fromAccountId: "acc-checking",
      toAccountId: "acc-savings",
      amount: 123456,
      occurredOn: "2026-09-01",
    });
  });

  it("keeps a real note", () => {
    expect(toNewTransfer(values({ note: "  Rainy day  " })).note).toBe(
      "Rainy day",
    );
  });

  it("falls back to zero when the amount cannot be parsed", () => {
    expect(toNewTransfer(values({ amount: "nope" })).amount).toBe(0);
  });
});

describe("validateTransferInput", () => {
  it("accepts a complete transfer", () => {
    expect(validateTransferInput(input(), ACCOUNT_IDS)).toEqual({});
  });

  it("requires both accounts", () => {
    expect(
      validateTransferInput(input({ fromAccountId: "" }), ACCOUNT_IDS)
        .fromAccountId,
    ).toBe("Choose the account to move money from.");
    expect(
      validateTransferInput(input({ toAccountId: "" }), ACCOUNT_IDS)
        .toAccountId,
    ).toBe("Choose the account to move money to.");
  });

  it("rejects accounts that do not exist", () => {
    expect(
      validateTransferInput(input({ fromAccountId: "acc-gone" }), ACCOUNT_IDS)
        .fromAccountId,
    ).toBe("Choose a valid account.");
    expect(
      validateTransferInput(input({ toAccountId: "acc-gone" }), ACCOUNT_IDS)
        .toAccountId,
    ).toBe("Choose a valid account.");
  });

  it("rejects moving money to the same account", () => {
    expect(
      validateTransferInput(
        input({ toAccountId: "acc-checking" }),
        ACCOUNT_IDS,
      ).toAccountId,
    ).toBe("Choose a different account.");
  });

  it("requires a positive whole number of cents", () => {
    for (const amount of [0, -1, 1.5, Number.NaN]) {
      expect(validateTransferInput(input({ amount })).amount).toBe(
        "Amount must be a positive whole number of cents.",
      );
    }
  });

  it("requires a real ISO date", () => {
    for (const occurredOn of ["", "2026-02-30", "09/01/2026"]) {
      expect(
        validateTransferInput(input({ occurredOn })).occurredOn,
      ).toBe("Date must be a valid YYYY-MM-DD date.");
    }
  });

  it("caps the optional note", () => {
    expect(
      validateTransferInput(
        input({ note: "x".repeat(MAX_TRANSFER_NOTE_LENGTH + 1) }),
      ).note,
    ).toContain("at most 120");
  });
});

describe("validateTransferForm", () => {
  it("validates the parsed form values", () => {
    expect(validateTransferForm(values(), ACCOUNT_IDS)).toEqual({});
    expect(validateTransferForm(values({ amount: "0" }), ACCOUNT_IDS).amount).toBe(
      "Amount must be a positive whole number of cents.",
    );
  });
});

describe("isTransfer", () => {
  it("accepts a complete transfer", () => {
    expect(isTransfer(TRANSFER)).toBe(true);
  });

  it("rejects malformed values", () => {
    expect(isTransfer(null)).toBe(false);
    expect(isTransfer({ ...TRANSFER, id: "" })).toBe(false);
    expect(isTransfer({ ...TRANSFER, fromAccountId: 1 })).toBe(false);
    expect(isTransfer({ ...TRANSFER, amount: 0 })).toBe(false);
    expect(isTransfer({ ...TRANSFER, occurredOn: "nope" })).toBe(false);
  });
});

describe("sanitizeTransfers", () => {
  it("keeps valid unique transfers", () => {
    expect(
      sanitizeTransfers([TRANSFER, { ...TRANSFER }, { ...TRANSFER, id: "tr-2" }]),
    ).toEqual([TRANSFER, { ...TRANSFER, id: "tr-2" }]);
  });

  it("returns an empty list for a non-array payload", () => {
    expect(sanitizeTransfers({ nope: true })).toEqual([]);
  });
});
