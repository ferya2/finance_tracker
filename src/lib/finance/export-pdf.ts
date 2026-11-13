import {
  BASE_CURRENCY,
  convertCurrency,
  isSupportedCurrency,
} from "./currency";
import { formatCurrency } from "./format";
import type { MonthlyReport } from "./monthly-report";
import { monthKey } from "./period";

/** Page geometry for the generated A4-like PDF, in PostScript points. */
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const BOTTOM_MARGIN = 50;
const LINE_HEIGHT_FACTOR = 1.5;

/** How a report PDF displays money. */
export interface ReportPdfOptions {
  /** ISO 4217 display currency; defaults to the app's base currency. */
  currency?: string;
  /** BCP 47 locale used to format amounts; defaults to `en-US`. */
  locale?: string;
}

/** One text line in a report PDF. */
export interface ReportPdfTextLine {
  text: string;
  /** Font size in points. */
  size: number;
  /** Render with Helvetica-Bold instead of Helvetica. */
  bold?: boolean;
  /** Extra vertical space above the line, in points. */
  gapBefore?: number;
}

/** A text line placed on a page at a concrete baseline position. */
interface PositionedPdfLine extends ReportPdfTextLine {
  y: number;
}

const ASCII_REPLACEMENTS: Readonly<Record<string, string>> = {
  "\u20ac": "EUR ",
  "\u00a3": "GBP ",
  "\u00a5": "JPY ",
  "\u20b9": "INR ",
  "\u20a9": "KRW ",
  "\u2014": "-",
  "\u2013": "-",
  "\u2019": "'",
  "\u2018": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u2026": "...",
  "\u2022": "-",
  "\u00a0": " ",
};

const REPLACEABLE = new RegExp(`[${Object.keys(ASCII_REPLACEMENTS).join("")}]`, "g");

/** Reduce text to characters the PDF's WinAnsi Helvetica font can render. */
function pdfSafeText(value: string): string {
  return value
    .replace(REPLACEABLE, (character) => ASCII_REPLACEMENTS[character] ?? "?")
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\x20-\x7e]/g, "?");
}

/** Escape a value for use inside a PDF literal string. */
export function escapePdfText(value: string): string {
  return pdfSafeText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/**
 * Format an amount stored in the base currency for a report, converting it to
 * the requested display currency first. Falls back to the base amount when the
 * currency or rate is unknown.
 */
export function formatReportAmount(
  cents: number,
  options: ReportPdfOptions = {},
): string {
  const requested = options.currency ?? BASE_CURRENCY;
  const currency = isSupportedCurrency(requested) ? requested : BASE_CURRENCY;
  const converted =
    convertCurrency(cents, BASE_CURRENCY, currency) ?? cents;

  return pdfSafeText(formatCurrency(converted, currency, options.locale));
}

function changeLabel(percent: number | null): string {
  if (percent === null) return "no change";
  if (percent === 0) return "0%";
  return `${percent > 0 ? "+" : ""}${percent}%`;
}

/**
 * Build the text lines of a monthly report: headline figures, month-over-month
 * changes, spending per category and budget performance. Pure — dates and money
 * come from the report, and the display currency is passed in as an option.
 */
export function buildReportPdfLines(
  report: MonthlyReport,
  options: ReportPdfOptions = {},
): ReportPdfTextLine[] {
  const amount = (cents: number) => formatReportAmount(cents, options);
  const lines: ReportPdfTextLine[] = [
    { text: "Finance Tracker", size: 22, bold: true },
    {
      text: `Monthly report - ${report.monthLabel}`,
      size: 16,
      bold: true,
      gapBefore: 6,
    },
    { text: "Summary", size: 13, bold: true, gapBefore: 20 },
    { text: `Income: ${amount(report.summary.income)}`, size: 11 },
    { text: `Expenses: ${amount(report.summary.expense)}`, size: 11 },
    { text: `Net: ${amount(report.summary.balance)}`, size: 11 },
    { text: `Transactions: ${report.transactionCount}`, size: 11 },
    {
      text: `Average spend per day: ${amount(report.dailyAverageExpense)}`,
      size: 11,
    },
    {
      text: `Compared with ${report.previousMonthName}: income ${changeLabel(
        report.incomeChangePercent,
      )}, expenses ${changeLabel(report.expenseChangePercent)}`,
      size: 11,
      gapBefore: 4,
    },
  ];

  if (report.topCategory) {
    lines.push({
      text: `Biggest category: ${report.topCategory.categoryName} (${amount(
        report.topCategory.amount,
      )}, ${report.topCategory.sharePercent}%)`,
      size: 11,
      gapBefore: 4,
    });
  }

  if (report.categories.length > 0) {
    lines.push({ text: "Spending by category", size: 13, bold: true, gapBefore: 18 });

    for (const category of report.categories) {
      lines.push({
        text: `${category.categoryName}: ${amount(category.amount)} (${
          category.sharePercent
        }%)`,
        size: 11,
      });
    }
  }

  if (report.budgets.length > 0) {
    lines.push({ text: "Budgets", size: 13, bold: true, gapBefore: 18 });

    for (const budget of report.budgets) {
      const status = budget.overBudget
        ? "over budget"
        : `${budget.percent}% used`;
      lines.push({
        text: `${budget.categoryName}: ${amount(budget.spent)} of ${amount(
          budget.limit,
        )} - ${status}`,
        size: 11,
      });
    }

    lines.push({
      text: `Budget total: ${amount(report.budgetTotals.spent)} of ${amount(
        report.budgetTotals.limit,
      )} (${report.budgetTotals.percent}%)`,
      size: 11,
      gapBefore: 4,
    });
  }

  lines.push({ text: "Generated by Finance Tracker", size: 9, gapBefore: 20 });

  return lines;
}

/**
 * Flow text lines onto pages, giving each line a baseline `y`. A new page starts
 * whenever the next line would fall into the bottom margin.
 */
export function paginateReportLines(
  lines: readonly ReportPdfTextLine[],
): PositionedPdfLine[][] {
  const pages: PositionedPdfLine[][] = [];
  let current: PositionedPdfLine[] = [];
  let cursor = PAGE_HEIGHT - MARGIN;

  for (const line of lines) {
    const gap = current.length === 0 ? 0 : line.gapBefore ?? 0;
    const leading = line.size * LINE_HEIGHT_FACTOR;
    let y = cursor - gap - leading;

    if (current.length > 0 && y < BOTTOM_MARGIN) {
      pages.push(current);
      current = [];
      cursor = PAGE_HEIGHT - MARGIN;
      y = cursor - leading;
    }

    current.push({ ...line, y });
    cursor = y;
  }

  if (current.length > 0) pages.push(current);

  return pages;
}

function pageContent(lines: readonly PositionedPdfLine[]): string {
  return lines
    .map((line) => {
      const font = line.bold ? "F2" : "F1";
      return `BT /${font} ${line.size} Tf 1 0 0 1 ${MARGIN} ${line.y.toFixed(
        2,
      )} Tm (${escapePdfText(line.text)}) Tj ET`;
    })
    .join("\n");
}

/** Assemble a complete PDF file from the already-rendered page streams. */
function assemblePdf(pageStreams: readonly string[]): string {
  const objects: string[] = [];
  const firstPageObject = 5;
  const pageObjects = pageStreams.map((_, index) => firstPageObject + index * 2);
  const contentObjects = pageStreams.map((_, index) => firstPageObject + index * 2 + 1);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjects
    .map((number) => `${number} 0 R`)
    .join(" ")}] /Count ${pageStreams.length} >>`;
  objects[3] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  pageStreams.forEach((stream, index) => {
    objects[pageObjects[index] as number] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> ` +
      `/Contents ${contentObjects[index]} 0 R >>`;
    objects[contentObjects[index] as number] =
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (let number = 1; number < objects.length; number += 1) {
    offsets[number] = pdf.length;
    pdf += `${number} 0 obj\n${objects[number]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let number = 1; number < objects.length; number += 1) {
    pdf += `${String(offsets[number]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return pdf;
}

/**
 * Serialize a monthly report as a printable PDF. The result is a complete PDF
 * document as text (all content is ASCII), ready to be wrapped in a Blob. Text
 * is paginated automatically and the report is never mutated.
 */
export function buildReportPdf(
  report: MonthlyReport,
  options: ReportPdfOptions = {},
): string {
  const pages = paginateReportLines(buildReportPdfLines(report, options));

  return assemblePdf(pages.map(pageContent));
}

/** The download name for a monthly report PDF, e.g. `monthly-report-2026-09.pdf`. */
export function reportPdfFileName(report: MonthlyReport): string {
  return `monthly-report-${monthKey(report.period.year, report.period.month)}.pdf`;
}
