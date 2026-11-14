import type { Category } from "@/types/category";
import type { NewTransaction, TransactionType } from "@/types/transaction";
import { parseAmount } from "./format";
import { validateTransaction } from "./transaction";

/** A row of the file that could not be imported, and why. */
export interface CsvImportError {
  /** 1-based line number in the source file (the header is line 1). */
  line: number;
  message: string;
}

/** What a CSV file parsed into: the rows to insert and the rows to skip. */
export interface CsvImportResult {
  /** Valid transactions ready to insert, in file order. */
  transactions: NewTransaction[];
  /** Problems that kept a row out of `transactions`. */
  errors: CsvImportError[];
  /** How many non-blank data rows the file had, valid or not. */
  totalRows: number;
}

/** The columns this importer understands, all matched case-insensitively. */
const REQUIRED_COLUMNS = ["date", "type", "category", "amount"] as const;

function isBlankRow(row: readonly string[]): boolean {
  return row.every((cell) => cell.trim() === "");
}

/**
 * Parse CSV text into a grid of fields. Handles quoted fields with embedded
 * commas, doubled quotes and line breaks, and accepts both CRLF and LF line
 * endings. A leading byte-order mark is dropped and a trailing newline does not
 * produce a phantom empty row.
 */
export function parseCsv(text: string): string[][] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let touched = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      touched = true;
      continue;
    }

    if (char === '"' && field.length === 0) {
      inQuotes = true;
      touched = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
      touched = true;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      touched = false;
    } else {
      field += char;
      touched = true;
    }
  }

  if (touched) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * Parse and validate a transactions CSV, resolving each row's category name
 * against the user's categories and returning only rows that are safe to
 * insert. The file is expected to carry the columns exported by
 * `transactionsToCsv` — Date, Type, Category, Note and Amount — in any order
 * (Note is optional). Amounts are decimal strings like `"12.34"` and become
 * integer cents; blank notes are dropped. Every rejected row is reported with
 * its source line number instead of failing the whole file, so a good file
 * imports in one pass and a bad one can be corrected row by row.
 */
export function parseTransactionsCsv(
  csv: string,
  categories: readonly Category[],
): CsvImportResult {
  const result: CsvImportResult = {
    transactions: [],
    errors: [],
    totalRows: 0,
  };

  const rows = parseCsv(csv);
  const headerIndex = rows.findIndex((row) => !isBlankRow(row));

  if (headerIndex === -1) {
    result.errors.push({ line: 1, message: "The file is empty." });
    return result;
  }

  const columns = new Map<string, number>();
  (rows[headerIndex] as string[]).forEach((name, index) => {
    const key = name.trim().toLowerCase();
    if (!columns.has(key)) {
      columns.set(key, index);
    }
  });

  const missing = REQUIRED_COLUMNS.filter((name) => !columns.has(name));
  if (missing.length > 0) {
    result.errors.push({
      line: headerIndex + 1,
      message: `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`,
    });
    return result;
  }

  const categoryByName = new Map<string, Category>();
  for (const category of categories) {
    const key = category.name.trim().toLowerCase();
    if (!categoryByName.has(key)) {
      categoryByName.set(key, category);
    }
  }

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index] as string[];
    if (isBlankRow(row)) continue;

    result.totalRows += 1;
    const line = index + 1;
    const cell = (name: string): string => {
      const column = columns.get(name);
      return column === undefined ? "" : (row[column] ?? "").trim();
    };

    const rawDate = cell("date");
    const rawType = cell("type").toLowerCase();
    const rawCategory = cell("category");
    const rawAmount = cell("amount");
    const rawNote = cell("note");

    const amount = parseAmount(rawAmount);
    const type: TransactionType | null =
      rawType === "income" || rawType === "expense" ? rawType : null;
    const category = categoryByName.get(rawCategory.toLowerCase());

    const candidate: NewTransaction = {
      amount: amount ?? 0,
      type: type ?? "expense",
      categoryId: category?.id ?? "",
      occurredOn: rawDate,
    };

    if (rawNote.length > 0) {
      candidate.note = rawNote;
    }

    const fieldErrors = validateTransaction(candidate);

    if (amount === null) {
      fieldErrors.amount = `"${rawAmount}" is not a valid amount.`;
    }
    if (type === null) {
      fieldErrors.type = `"${rawType || "(empty)"}" is not a valid type — use income or expense.`;
    }
    if (!category) {
      fieldErrors.categoryId = `No category named "${rawCategory || "(empty)"}".`;
    }

    const messages = Object.values(fieldErrors);
    if (messages.length > 0) {
      result.errors.push({ line, message: messages.join(" ") });
      continue;
    }

    result.transactions.push(candidate);
  }

  return result;
}
