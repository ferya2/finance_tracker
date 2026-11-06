import type { NewTag, Tag } from "@/types/tag";
import {
  CATEGORY_COLOR_PALETTE,
  isValidCategoryColor,
} from "./category-form";
import { MAX_TAG_NAME_LENGTH, normalizeTagName } from "./tags";

export interface TagFormValues {
  name: string;
  color: string;
}

export interface TagFormErrors {
  name?: string;
  color?: string;
}

export const TAG_COLOR_PALETTE = CATEGORY_COLOR_PALETTE;

export const MAX_TAG_NAME = MAX_TAG_NAME_LENGTH;

export function emptyTagForm(
  color: string = TAG_COLOR_PALETTE[2],
): TagFormValues {
  return { name: "", color };
}

export function tagToFormValues(tag: Tag): TagFormValues {
  return { name: tag.name, color: tag.color };
}

export function toNewTag(values: TagFormValues): NewTag {
  return {
    name: normalizeTagName(values.name),
    color: values.color,
  };
}

export function validateTagForm(values: TagFormValues): TagFormErrors {
  const errors: TagFormErrors = {};
  const name = normalizeTagName(values.name);

  if (name.length === 0) {
    errors.name = "Name is required.";
  } else if (name.length > MAX_TAG_NAME_LENGTH) {
    errors.name = `Name must be at most ${MAX_TAG_NAME_LENGTH} characters.`;
  }

  if (!isValidCategoryColor(values.color)) {
    errors.color = "Choose a valid colour.";
  }

  return errors;
}
