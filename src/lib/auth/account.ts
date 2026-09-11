import type { AuthUser } from "./session";

export const UNKNOWN_INITIALS = "?";
export const DEFAULT_DISPLAY_NAME = "Finance Tracker User";

function localPart(email: string): string {
  return email.split("@")[0] ?? "";
}

function initialsFromLocalPart(local: string): string {
  return local
    .split(/[^a-z0-9]+/i)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/** Avatar initials derived from the email's local part (e.g. "ada" → "A"). */
export function getProfileInitials(user: AuthUser): string {
  if (!user.email) return UNKNOWN_INITIALS;
  return initialsFromLocalPart(localPart(user.email)) || UNKNOWN_INITIALS;
}

/** Human-friendly label for the current user. */
export function getDisplayName(user: AuthUser): string {
  return user.email ?? DEFAULT_DISPLAY_NAME;
}

/** Short, scannable form of the user id for display. */
export function getShortId(id: string): string {
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`;
}