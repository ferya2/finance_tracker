import { describe, expect, it } from "vitest";
import {
  CSV_HEADERS,
  escapeCsvField,
  exportCsvFileName,
  formatCsvAmount,
  transactionToCsvRow,
  transactionsToCsv,
} from "./export-csv";
import type { TransactionListRow } from "./transaction-list";

const ROWS: TransactionListRow[] = [
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

describe("escapeCsvField", () => {
  it("leaves plain values untouched", () => {
    expect(escapeCsvField("Weekly groceries")).toBe("Weekly groceries");
    expect(escapeCsvField("")).toBe("");
  });

  it("quotes values containing a comma", () => {
    expect(escapeCsvField("Rent, utilities")).toBe('"Rent, utilities"');
  });

  it("quotes and doubles embedded quotes", () => {
    expect(escapeCsvField('He said "hi"')).toBe('"He said ""hi"""');
  });

  it("quotes values spanning lines", () => {
    expect(escapeCsvField("line one\nline two")).toBe(
      '"line one\nline two"',
    );
    expect(escapeCsvField("line one\r\nline two")).toBe(
      '"line one\r\nline two"',
    );
  });
});

describe("formatCsvAmount", () => {
  it("renders cents as a plain two-decimal amount", () => {
    expect(formatCsvAmount(8635)).toBe("86.35");
    expect(formatCsvAmount(240000)).toBe("2400.00");
    expect(formatCsvAmount(5)).toBe("0.05");
    expect(formatCsvAmount(0)).toBe("0.00");
  });
});

describe("transactionToCsvRow", () => {
  it("writes the date, type, category, note and amount in order", () => {
    expect(transactionToCsvRow(ROWS[0] as TransactionListRow)).toBe(
      "2026-09-15,expense,Food & dining,Weekly groceries,86.35",
    );
  });

  it("escapes values that need it", () => {
    expect(
      transactionToCsvRow({
        ...(ROWS[0] as TransactionListRow),
        note: 'Lunch, "team"',
      }),
    ).toBe('2026-09-15,expense,Food & dining,"Lunch, ""team""",86.35');
  });
});

describe("transactionsToCsv", () => {
  it("starts with the header row and writes CRLF line endings", () => {
    const csv = transactionsToCsv(ROWS);

    expect(csv).toBe(
      `${CSV_HEADERS.join(",")}\r\n` +
        "2026-09-15,expense,Food & dining,Weekly groceries,86.35\r\n" +
        "2026-09-01,income,Salary,Monthly salary,2400.00\r\n",
    );
  });

  it("keeps the order it was given", () => {
    const csv = transactionsToCsv([...ROWS].reverse());
    const lines = csv.split("\r\n");

    expect(lines[1]).toContain("Monthly salary");
    expect(lines[2]).toContain("Weekly groceries");
  });

  it("still writes a header when there is nothing to export", () => {
    expect(transactionsToCsv([])).toBe(`${CSV_HEADERS.join(",")}\r\n`);
  });

  it("does not mutate the rows it was given", () => {
    const ids = ROWS.map((row) => row.id);

    transactionsToCsv(ROWS);

    expect(ROWS.map((row) => row.id)).toEqual(ids);
  });

  it("is a pure function of its arguments", () => {
    expect(transactionsToCsv(ROWS)).toBe(transactionsToCsv(ROWS));
  });
});

describe("exportCsvFileName", () => {
  it("names the file after the export date", () => {
    expect(exportCsvFileName("2026-11-12")).toBe(
      "transactions-2026-11-12.csv",
    );
  });
});
