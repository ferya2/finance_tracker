import type { Category, NewCategory } from "@/types/category";
import type { TransactionType } from "@/types/transaction";

/**
 * What a category form holds while it is being filled in. The name is raw text
 * (trimmed only on submit) and the colour is one of the offered swatches, but it
 * is still validated so an unexpected value can never be saved.
 */
export interface CategoryFormValues {
  name: string;
  kind: TransactionType;
  /** A `#rrggbb` hex colour. */
  color: string;
}

export interface CategoryErrors {
  name?: string;
  kind?: string;
  color?: string;
}

export const MAX_CATEGORY_NAME_LENGTH = 40;

/**
 * The swatches the picker offers — one restrained set of hues that reads well on
 * both the light and dark surfaces.
 */
export const CATEGORY_COLOR_PALETTE: readonly string[] = [
  "#e11d48",
  "#db2777",
  "#7c3aed",
  "#4f46e5",
  "#2563eb",
  "#0284c7",
  "#0d9488",
  "#059669",
  "#65a30d",
  "#d97706",
];

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** True when `color` is a `#rrggbb` hex string the picker can render. */
export function isValidCategoryColor(color: string): boolean {
  return typeof color === "string" && HEX_COLOR_PATTERN.test(color);
}

/**
 * A blank form: an expense, no name and the first palette colour. The default
 * colour is fixed rather than random so the form is deterministic and testable.
 */
export function emptyCategoryForm(
  color: string = CATEGORY_COLOR_PALETTE[0],
): CategoryFormValues {
  return { name: "", kind: "expense", color };
}

/** Prefill an edit form from a category that is already saved. */
export function categoryToFormValues(category: Category): CategoryFormValues {
  return {
    name: category.name,
    kind: category.kind,
    color: category.color,
  };
}

/**
 * Turn form values into the shape the database stores: the name is trimmed and
 * the kind and colour are passed through.
 */
export function toNewCategory(values: CategoryFormValues): NewCategory {
  return {
    name: values.name.trim(),
    kind: values.kind,
    color: values.color,
  };
}

/**
 * Validate a category form. The name is required and has a size limit, the kind
 * must be income or expense, and the colour must be a valid hex swatch. Returns
 * per-field error messages (empty when valid).
 */
export function validateCategoryForm(
  values: CategoryFormValues,
): CategoryErrors {
  const errors: CategoryErrors = {};
  const name = values.name.trim();

  if (name.length === 0) {
    errors.name = "Name is required.";
  } else if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    errors.name = `Name must be at most ${MAX_CATEGORY_NAME_LENGTH} characters.`;
  }

  if (values.kind !== "income" && values.kind !== "expense") {
    errors.kind = 'Kind must be "income" or "expense".';
  }

  if (!isValidCategoryColor(values.color)) {
    errors.color = "Choose a valid colour.";
  }

  return errors;
}
