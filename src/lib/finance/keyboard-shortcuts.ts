export type ShortcutGroup = "General" | "Actions" | "Navigation";

export interface ShortcutKeyEvent {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export interface EditableTarget {
  tagName?: string;
  isContentEditable?: boolean;
}

export interface KeyboardShortcut {
  id: string;
  label: string;
  description: string;
  group: ShortcutGroup;
  sequence: readonly string[];
  href?: string;
}

export const MAX_SHORTCUT_SEQUENCE_LENGTH = 2;

export const SHORTCUT_GROUP_ORDER: readonly ShortcutGroup[] = [
  "General",
  "Actions",
  "Navigation",
];

export const KEYBOARD_SHORTCUTS: readonly KeyboardShortcut[] = [
  {
    id: "help",
    label: "Keyboard shortcuts",
    description: "Show this shortcut list",
    group: "General",
    sequence: ["?"],
  },
  {
    id: "command-palette",
    label: "Command palette",
    description: "Search actions and pages",
    group: "General",
    sequence: ["mod+k"],
  },
  {
    id: "quick-add",
    label: "New transaction",
    description: "Open the quick add form",
    group: "Actions",
    sequence: ["n"],
  },
  {
    id: "go-dashboard",
    label: "Dashboard",
    description: "Go to your overview",
    group: "Navigation",
    sequence: ["g", "d"],
    href: "/dashboard",
  },
  {
    id: "go-transactions",
    label: "Transactions",
    description: "Go to your history",
    group: "Navigation",
    sequence: ["g", "t"],
    href: "/dashboard/transactions",
  },
  {
    id: "go-accounts",
    label: "Accounts",
    description: "Go to your wallets",
    group: "Navigation",
    sequence: ["g", "a"],
    href: "/dashboard/accounts",
  },
  {
    id: "go-categories",
    label: "Categories",
    description: "Go to your categories",
    group: "Navigation",
    sequence: ["g", "c"],
    href: "/dashboard/categories",
  },
  {
    id: "go-budgets",
    label: "Budgets",
    description: "Go to your limits",
    group: "Navigation",
    sequence: ["g", "b"],
    href: "/dashboard/budgets",
  },
  {
    id: "go-reports",
    label: "Reports",
    description: "Go to your charts",
    group: "Navigation",
    sequence: ["g", "r"],
    href: "/dashboard/reports",
  },
  {
    id: "go-insights",
    label: "Insights",
    description: "Go to your spending insights",
    group: "Navigation",
    sequence: ["g", "i"],
    href: "/dashboard/insights",
  },
  {
    id: "go-settings",
    label: "Settings",
    description: "Go to your preferences",
    group: "Navigation",
    sequence: ["g", "s"],
    href: "/dashboard/settings",
  },
];

export function normalizeShortcutKey(event: ShortcutKeyEvent): string {
  const key = event.key === " " ? "space" : event.key.toLowerCase();
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("mod");
  if (event.altKey) parts.push("alt");
  parts.push(key);
  return parts.join("+");
}

export function isEditableTarget(target: EditableTarget | null): boolean {
  if (!target) return false;
  if (target.isContentEditable === true) return true;
  const tag = target.tagName?.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function matchShortcut(
  sequence: readonly string[],
  shortcuts: readonly KeyboardShortcut[] = KEYBOARD_SHORTCUTS,
): KeyboardShortcut | undefined {
  return shortcuts.find(
    (shortcut) =>
      shortcut.sequence.length === sequence.length &&
      shortcut.sequence.every(
        (token, index) => token.toLowerCase() === sequence[index].toLowerCase(),
      ),
  );
}

export function isShortcutPrefix(
  sequence: readonly string[],
  shortcuts: readonly KeyboardShortcut[] = KEYBOARD_SHORTCUTS,
): boolean {
  if (sequence.length === 0) return false;
  return shortcuts.some(
    (shortcut) =>
      shortcut.sequence.length > sequence.length &&
      shortcut.sequence
        .slice(0, sequence.length)
        .every((token, index) => token.toLowerCase() === sequence[index].toLowerCase()),
  );
}

export function formatShortcutKeys(sequence: readonly string[]): string[] {
  return sequence.map((token) =>
    token
      .split("+")
      .map((part) => {
        if (part === "mod") return "Ctrl";
        if (part === "alt") return "Alt";
        return part.toUpperCase();
      })
      .join("+"),
  );
}
