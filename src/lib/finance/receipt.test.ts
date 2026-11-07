import { describe, expect, it } from "vitest";
import {
  ACCEPTED_RECEIPT_TYPES,
  MAX_RECEIPT_BYTES,
  RECEIPT_ACCEPT,
  buildReceiptPath,
  displayReceiptName,
  formatReceiptSize,
  isAcceptedReceiptType,
  receiptExtensionForType,
  receiptFileName,
  receiptFolder,
  sanitizeReceiptFileName,
  validateReceiptFile,
} from "./receipt";

describe("receipt file validation", () => {
  const jpeg = { name: "lunch-receipt.jpg", type: "image/jpeg", size: 84_000 };

  it("accepts a normal image under the size limit", () => {
    expect(validateReceiptFile(jpeg)).toEqual({ valid: true, errors: [] });
  });

  it("builds an accept attribute from the supported image types", () => {
    expect(RECEIPT_ACCEPT).toBe(ACCEPTED_RECEIPT_TYPES.join(","));
  });

  it("accepts every supported image type", () => {
    for (const type of ACCEPTED_RECEIPT_TYPES) {
      expect(
        validateReceiptFile({ name: "receipt", type, size: 1024 }).valid,
      ).toBe(true);
    }
  });

  it("rejects a file with no name", () => {
    const result = validateReceiptFile({ ...jpeg, name: "  " });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Choose a receipt image.");
  });

  it("rejects a non-image file", () => {
    const result = validateReceiptFile({ ...jpeg, type: "application/pdf" });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/JPG, PNG, WebP/);
  });

  it("rejects an empty file", () => {
    const result = validateReceiptFile({ ...jpeg, size: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("That file looks empty.");
  });

  it("rejects a file above the size limit", () => {
    const result = validateReceiptFile({
      ...jpeg,
      size: MAX_RECEIPT_BYTES + 1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("5 MB");
  });

  it("allows a file exactly at the size limit", () => {
    expect(
      validateReceiptFile({ ...jpeg, size: MAX_RECEIPT_BYTES }).valid,
    ).toBe(true);
  });
});

describe("receipt file names", () => {
  it("keeps only the last path segment and folds unsafe characters", () => {
    expect(sanitizeReceiptFileName("../../My Receipt (final).JPG")).toBe(
      "my-receipt-final.jpg",
    );
  });

  it("strips diacritics and collapses repeated dashes", () => {
    expect(sanitizeReceiptFileName("Café  ---  Receipt.png")).toBe(
      "cafe-receipt.png",
    );
  });

  it("falls back to receipt when nothing usable remains", () => {
    expect(sanitizeReceiptFileName("   ")).toBe("receipt");
    expect(sanitizeReceiptFileName("///")).toBe("receipt");
  });

  it("adds an extension from the MIME type when the name has none", () => {
    expect(
      receiptFileName({ name: "Lunch", type: "image/jpeg", size: 100 }),
    ).toBe("lunch.jpg");
  });

  it("keeps an extension the file already has", () => {
    expect(
      receiptFileName({ name: "Lunch.PNG", type: "image/png", size: 100 }),
    ).toBe("lunch.png");
  });

  it("maps MIME types to extensions and ignores unknown ones", () => {
    expect(receiptExtensionForType("image/jpeg")).toBe("jpg");
    expect(receiptExtensionForType("image/webp")).toBe("webp");
    expect(receiptExtensionForType("text/plain")).toBeNull();
  });

  it("recognises supported types case-insensitively", () => {
    expect(isAcceptedReceiptType("IMAGE/PNG")).toBe(true);
    expect(isAcceptedReceiptType("image/gif")).toBe(false);
  });
});

describe("receipt storage paths", () => {
  it("groups receipts by user and transaction", () => {
    expect(receiptFolder("user-1", "txn-1")).toBe("user-1/txn-1");
  });

  it("sanitises path segments", () => {
    expect(receiptFolder("User 1", "txn/../1")).toBe("user-1/txn-1");
  });

  it("prefixes the safe file name with a timestamp", () => {
    expect(
      buildReceiptPath("user-1", "txn-1", "Lunch Receipt.JPG", 1_700_000_000_000),
    ).toBe("user-1/txn-1/1700000000000-lunch-receipt.jpg");
  });

  it("falls back to zero for an invalid timestamp", () => {
    expect(
      buildReceiptPath("user-1", "txn-1", "receipt.png", Number.NaN),
    ).toBe("user-1/txn-1/0-receipt.png");
  });

  it("recovers the original file name from a stored object name", () => {
    expect(displayReceiptName("1700000000000-lunch-receipt.jpg")).toBe(
      "lunch-receipt.jpg",
    );
    expect(displayReceiptName("")).toBe("receipt");
  });
});

describe("receipt size formatting", () => {
  it("shows bytes, kilobytes and megabytes compactly", () => {
    expect(formatReceiptSize(0)).toBe("0 KB");
    expect(formatReceiptSize(512)).toBe("512 B");
    expect(formatReceiptSize(2048)).toBe("2.0 KB");
    expect(formatReceiptSize(64 * 1024)).toBe("64 KB");
    expect(formatReceiptSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("handles nonsensical sizes", () => {
    expect(formatReceiptSize(Number.NaN)).toBe("0 KB");
    expect(formatReceiptSize(-1)).toBe("0 KB");
  });
});
