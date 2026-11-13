import { describe, expect, it } from "vitest";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import {
  buildReportPdf,
  buildReportPdfLines,
  escapePdfText,
  formatReportAmount,
  paginateReportLines,
  reportPdfFileName,
  type ReportPdfTextLine,
} from "./export-pdf";
import { buildMonthlyReport, type MonthlyReport } from "./monthly-report";

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
];

const TRANSACTIONS: Transaction[] = [
  {
    id: "sep-salary",
    amount: 500000,
    type: "income",
    categoryId: "cat-salary",
    note: "Monthly salary",
    occurredOn: "2026-09-01",
  },
  {
    id: "sep-housing",
    amount: 115000,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-09-04",
  },
  {
    id: "sep-food",
    amount: 15000,
    type: "expense",
    categoryId: "cat-food",
    note: "Groceries",
    occurredOn: "2026-09-05",
  },
  {
    id: "aug-salary",
    amount: 400000,
    type: "income",
    categoryId: "cat-salary",
    note: "Monthly salary",
    occurredOn: "2026-08-01",
  },
  {
    id: "aug-food",
    amount: 20000,
    type: "expense",
    categoryId: "cat-food",
    note: "Groceries",
    occurredOn: "2026-08-15",
  },
];

const BUDGETS: Budget[] = [
  {
    id: "budget-housing",
    categoryId: "cat-housing",
    month: "2026-09",
    limitAmount: 130000,
  },
];

function septemberReport(): MonthlyReport {
  return buildMonthlyReport(
    { transactions: TRANSACTIONS, categories: CATEGORIES, budgets: BUDGETS },
    { year: 2026, month: 9 },
  );
}

describe("escapePdfText", () => {
  it("escapes parentheses and backslashes", () => {
    expect(escapePdfText("Rent (September) \\ paid")).toBe(
      "Rent \\(September\\) \\\\ paid",
    );
  });

  it("keeps plain text untouched", () => {
    expect(escapePdfText("Food & dining")).toBe("Food & dining");
  });

  it("transliterates common non-ASCII characters", () => {
    expect(escapePdfText("Caf\u00e9 \u2014 \u20ac12")).toBe("Caf? - EUR 12");
    expect(escapePdfText("line one\nline two")).toBe("line one line two");
  });
});

describe("formatReportAmount", () => {
  it("formats base amounts as currency", () => {
    expect(formatReportAmount(123456)).toBe("$1,234.56");
  });

  it("converts to the requested display currency", () => {
    expect(formatReportAmount(123456, { currency: "EUR" })).toBe(
      "EUR 1,135.80",
    );
  });

  it("falls back to the base amount for an unknown currency", () => {
    expect(formatReportAmount(123456, { currency: "XXX" })).toBe("$1,234.56");
  });
});

describe("buildReportPdfLines", () => {
  it("writes the month's headline figures", () => {
    const lines = buildReportPdfLines(septemberReport());
    const text = lines.map((line) => line.text).join("\n");

    expect(text).toContain("Monthly report - September 2026");
    expect(text).toContain("Income: $5,000.00");
    expect(text).toContain("Expenses: $1,300.00");
    expect(text).toContain("Net: $3,700.00");
    expect(text).toContain("Transactions: 3");
    expect(text).toContain("Compared with August: income +25%, expenses +550%");
  });

  it("lists spending by category and budget performance", () => {
    const text = buildReportPdfLines(septemberReport())
      .map((line) => line.text)
      .join("\n");

    expect(text).toContain("Spending by category");
    expect(text).toContain("Housing: $1,150.00 (88%)");
    expect(text).toContain("Food & dining: $150.00 (12%)");
    expect(text).toContain("Budgets");
    expect(text).toContain("Housing: $1,150.00 of $1,300.00 - 88% used");
    expect(text).toContain("Budget total: $1,150.00 of $1,300.00 (88%)");
  });

  it("uses the requested display currency", () => {
    const text = buildReportPdfLines(septemberReport(), { currency: "EUR" })
      .map((line) => line.text)
      .join("\n");

    expect(text).toContain("Income: EUR 4,600.00");
  });

  it("handles a report with no categories or budgets", () => {
    const report = buildMonthlyReport(
      { transactions: [], categories: CATEGORIES, budgets: [] },
      { year: 2026, month: 9 },
    );
    const text = buildReportPdfLines(report)
      .map((line) => line.text)
      .join("\n");

    expect(text).toContain("Income: $0.00");
    expect(text).toContain(
      "Compared with August: income no change, expenses no change",
    );
    expect(text).not.toContain("Spending by category");
    expect(text).not.toContain("Budgets");
  });
});

describe("paginateReportLines", () => {
  const lines: ReportPdfTextLine[] = Array.from({ length: 60 }, (_, index) => ({
    text: `Line ${index + 1}`,
    size: 11,
  }));

  it("flows long reports onto more than one page", () => {
    const pages = paginateReportLines(lines);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages.flat()).toHaveLength(lines.length);
    expect(pages.every((page) => page.length > 0)).toBe(true);
  });

  it("keeps every line inside the vertical margins", () => {
    const placed = paginateReportLines(lines).flat();

    expect(placed.every((line) => line.y > 0 && line.y < 792)).toBe(true);
  });

  it("returns no pages for no lines", () => {
    expect(paginateReportLines([])).toEqual([]);
  });
});

describe("buildReportPdf", () => {
  it("builds a complete single-page PDF document", () => {
    const pdf = buildReportPdf(septemberReport());

    expect(pdf.startsWith("%PDF-1.4\n")).toBe(true);
    expect(pdf.endsWith("%%EOF\n")).toBe(true);
    expect(pdf).toContain("/Type /Catalog");
    expect(pdf).toContain("/BaseFont /Helvetica");
    expect(pdf).toContain("/Count 1");
    expect(pdf).toContain("(Monthly report - September 2026) Tj");
    expect(pdf).toContain("(Food & dining: $150.00 \\(12%\\)) Tj");
  });

  it("writes xref offsets that point at the objects", () => {
    const pdf = buildReportPdf(septemberReport());
    const startxref = Number(/startxref\n(\d+)/.exec(pdf)?.[1]);

    expect(pdf.slice(startxref, startxref + 4)).toBe("xref");

    const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)].map((match) =>
      Number(match[1]),
    );

    offsets.forEach((offset, index) => {
      expect(pdf.slice(offset, offset + `${index + 1} 0 obj`.length)).toBe(
        `${index + 1} 0 obj`,
      );
    });
  });

  it("paginates a report with many categories", () => {
    const report = septemberReport();
    const categories = Array.from({ length: 50 }, (_, index) => ({
      categoryId: `cat-${index}`,
      categoryName: `Category ${index + 1}`,
      categoryColor: "#94a3b8",
      amount: 1000,
      sharePercent: 2,
    }));
    const pdf = buildReportPdf({ ...report, categories });

    const pageCount = Number(/\/Count (\d+)/.exec(pdf)?.[1]);

    expect(pageCount).toBeGreaterThan(1);
  });

  it("names the file after the report month", () => {
    expect(reportPdfFileName(septemberReport())).toBe(
      "monthly-report-2026-09.pdf",
    );
  });

  it("does not mutate the report", () => {
    const report = septemberReport();
    const ids = report.categories.map((category) => category.categoryId);

    buildReportPdf(report);

    expect(report.categories.map((category) => category.categoryId)).toEqual(
      ids,
    );
  });
});
