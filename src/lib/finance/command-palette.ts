export interface PaletteCommand {
  id: string;
  label: string;
  description: string;
  keywords?: readonly string[];
}

export interface PaletteShortcut {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

export function isPaletteShortcut(event: PaletteShortcut): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    event.key.toLowerCase() === "k"
  );
}

function scoreCommand(command: PaletteCommand, needle: string): number {
  const label = command.label.toLowerCase();
  if (label === needle) return 0;
  if (label.startsWith(needle)) return 1;

  const keywords = command.keywords?.map((keyword) => keyword.toLowerCase()) ?? [];
  if (keywords.some((keyword) => keyword === needle || keyword.startsWith(needle))) {
    return 2;
  }
  if (label.includes(needle)) return 3;
  if (
    command.description.toLowerCase().includes(needle) ||
    keywords.some((keyword) => keyword.includes(needle))
  ) {
    return 4;
  }
  return -1;
}

export function filterPaletteCommands<T extends PaletteCommand>(
  commands: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [...commands];

  return commands
    .map((command, index) => ({
      command,
      index,
      score: scoreCommand(command, needle),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((entry) => entry.command);
}

export function movePaletteSelection(
  current: number,
  step: number,
  length: number,
): number {
  if (length <= 0) return -1;
  const position = Number.isFinite(current) ? current : 0;
  const next = (position + step) % length;
  return next < 0 ? next + length : next;
}
