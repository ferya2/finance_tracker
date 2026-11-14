import { describe, expect, it } from "vitest";
import { parseCsv, parseTransactionsCsv } from "./import-csv";
import { transactionsToCsv } from "./export-csv";
import type { TransactionListRow } from "./transaction-list";
import type { Category } from "@/types/category";

const CATEGORIES: Category[] = [
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
];

describe("parseCsv", () => {
  it("splits simple rows on commas and line breaks", () => {
    expect(parseCsv("a,b\r\nc,d\r\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("accepts LF line endings", () => {
    expect(parseCsv("a,b\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("does not add an empty row after a trailing newline", () => {
    expect(parseCsv("a\n")).toEqual([["a"]]);
  });

  it("reads quoted fields with commas and escaped quotes", () => {
    expect(parseCsv('"Rent, utilities",He said "hi"')).toEqual([
      ["Rent, utilities", 'He said "hi"'],
    ]);
    expect(parseCsv('"He said ""hi"""')).toEqual([['He said "hi"']]);
  });

  it("keeps line breaks inside quoted fields", () => {
    expect(parseCsv('"line one\nline two",next')).toEqual([
      ["line one\nline two", "next"],
    ]);
  });

  it("drops a leading byte-order mark", () => {
    expect(parseCsv("\uFEFFDate,Amount")).toEqual([["Date", "Amount"]]);
  });

  it("returns nothing for empty text", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("keeps deliberately empty fields", () => {
    expect(parseCsv("a,,c")).toEqual([["a", "", "c"]]);
  });
});

describe("parseTransactionsCsv", () => {
  const HEADER = "Date,Type,Category,Note,Amount";

  it("turns valid rows into transactions with cents and resolved categories", () => {
    const result = parseTransactionsCsv(
      [
        HEADER,
        "2026-09-15,expense,Food & dining,Weekly groceries,86.35",
        "2026-09-01,income,Salary,Monthly salary,2400.00",
      ].join("\r\n"),
      CATEGORIES,
    );

    expect(result.errors).toEqual([]);
    expect(result.totalRows).toBe(2);
    expect(result.transactions).toEqual([
      {
        amount: 8635,
        type: "expense",
        categoryId: "cat-food",
        note: "Weekly groceries",
        occurredOn: "2026-09-15",
      },
      {
        amount: 240000,
        type: "income",
        categoryId: "cat-salary",
        note: "Monthly salary",
        occurredOn: "2026-09-01",
      },
    ]);
  });

  it("resolves categories and column names case-insensitively", () => {
    const result = parseTransactionsCsv(
      "date,TYPE,category,amount\n2026-09-15,EXPENSE,housing,1150.00",
      CATEGORIES,
    );

    expect(result.errors).toEqual([]);
    expect(result.transactions).toEqual([
      {
        amount: 115000,
        type: "expense",
        categoryId: "cat-housing",
        occurredOn: "2026-09-15",
      },
    ]);
  });

  it("does not require a Note column", () => {
    const result = parseTransactionsCsv(
      "Date,Type,Category,Amount\n2026-09-15,expense,Housing,1150",
      CATEGORIES,
    );

    expect(result.errors).toEqual([]);
    expect(result.transactions[0]).toEqual({
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      occurredOn: "2026-09-15",
    });
  });

  it("accepts thousand separators and a currency prefix in amounts", () => {
    const result = parseTransactionsCsv(
      `${HEADER}\n2026-09-15,expense,Housing,Rent,"$1,150.50"`,
      CATEGORIES,
    );

    expect(result.errors).toEqual([]);
    expect(result.transactions[0]?.amount).toBe(115050);
  });

  it("rejects rows with an unknown category, keeping the valid ones", () => {
    const result = parseTransactionsCsv(
      [
        HEADER,
        "2026-09-15,expense,Groceries,Food,10.00",
        "2026-09-16,expense,Food & dining,Food,12.00",
      ].join("\n"),
      CATEGORIES,
    );

    expect(result.totalRows).toBe(2);
    expect(result.transactions).toHaveLength(1);
    expect(result.errors).toEqual([
      {
        line: 2,
        message: 'No category named "Groceries".',
      },
    ]);
  });

  it("rejects invalid types, amounts and dates together", () => {
    const result = parseTransactionsCsv(
      [
        HEADER,
        "2026-02-30,transfer,Housing,,twelve",
        "not-a-date,expense,Housing,,10.00",
      ].join("\n"),
      CATEGORIES,
    );

    expect(result.transactions).toEqual([]);
    expect(result.totalRows).toBe(2);
    expect(result.errors[0]?.line).toBe(2);
    expect(result.errors[0]?.message).toContain('"transfer" is not a valid type');
    expect(result.errors[0]?.message).toContain('"twelve" is not a valid amount');
    expect(result.errors[0]?.message).toContain("valid YYYY-MM-DD date");
    expect(result.errors[1]?.line).toBe(3);
    expect(result.errors[1]?.message).toContain("valid YYYY-MM-DD date");
  });

  it("rejects a zero or negative amount", () => {
    const result = parseTransactionsCsv(
      [
        HEADER,
        "2026-09-15,expense,Housing,Zero,0",
        "2026-09-15,expense,Housing,Negative,-5.00",
      ].join("\n"),
      CATEGORIES,
    );

    expect(result.transactions).toEqual([]);
    expect(result.totalRows).toBe(2);
    expect(result.errors).toHaveLength(2);
  });

  it("rejects a note longer than the transaction limit", () => {
    const result = parseTransactionsCsv(
      `${HEADER}\n2026-09-15,expense,Housing,${"x".repeat(201)},10.00`,
      CATEGORIES,
    );

    expect(result.transactions).toEqual([]);
    expect(result.errors[0]?.message).toContain("at most 200 characters");
  });

  it("reports a missing required column", () => {
    const result = parseTransactionsCsv(
      "Date,Type,Note,Amount\n2026-09-15,expense,Food,10.00",
      CATEGORIES,
    );

    expect(result.transactions).toEqual([]);
    expect(result.errors).toEqual([
      { line: 1, message: "Missing required column: category." },
    ]);
  });

  it("reports multiple missing columns", () => {
    const result = parseTransactionsCsv(
      "Date,Type\n2026-09-15,expense",
      CATEGORIES,
    );

    expect(result.errors[0]?.message).toBe(
      "Missing required columns: category, amount.",
    );
  });

  it("reports an empty file", () => {
    expect(parseTransactionsCsv("", CATEGORIES)).toEqual({
      transactions: [],
      errors: [{ line: 1, message: "The file is empty." }],
      totalRows: 0,
    });
  });

  it("skips blank lines without counting them", () => {
    const result = parseTransactionsCsv(
      `${HEADER}\n\n2026-09-15,expense,Housing,Rent,10.00\n\n`,
      CATEGORIES,
    );

    expect(result.totalRows).toBe(1);
    expect(result.transactions).toHaveLength(1);
    expect(result.errors).toEqual([]);
  });

  it("handles quoted notes with commas and quotes", () => {
    const result = parseTransactionsCsv(
      `${HEADER}\r\n2026-09-15,expense,Housing,"Rent, ""final""",10.00\r\n`,
      CATEGORIES,
    );

    expect(result.errors).toEqual([]);
    expect(result.transactions[0]?.note).toBe('Rent, "final"');
  });

  it("round-trips a CSV produced by the exporter", () => {
    const rows: TransactionListRow[] = [
      {
        id: "txn-1",
        note: "Weekly groceries",
        amount: 8635,
        type: "expense",
        categoryId: "cat-food",
        occurredOn: "2026-09-15",
        dateLabel: "Today",
        categoryName: "Food & dining",
        categoryColor: "#e11d48",
      },
      {
        id: "txn-2",
        note: "Monthly salary",
        amount: 240000,
        type: "income",
        categoryId: "cat-salary",
        occurredOn: "2026-09-01",
        dateLabel: "Fri, 1 Sep",
        categoryName: "Salary",
        categoryColor: "#059669",
      },
    ];

    const result = parseTransactionsCsv(transactionsToCsv(rows), CATEGORIES);

    expect(result.errors).toEqual([]);
    expect(result.transactions).toEqual([
      {
        amount: 8635,
        type: "expense",
        categoryId: "cat-food",
        note: "Weekly groceries",
        occurredOn: "2026-09-15",
      },
      {
        amount: 240000,
        type: "income",
        categoryId: "cat-salary",
        note: "Monthly salary",
        occurredOn: "2026-09-01",
      },
    ]);
  });
});
