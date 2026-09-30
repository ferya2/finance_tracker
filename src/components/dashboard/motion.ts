/** The house easing curve — a soft ease-out shared by every dashboard motion. */
export const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

/**
 * Longest an item may wait before it starts entering. Without a cap, a long
 * list (a dozen budgets, say) would leave its last rows waiting for most of a
 * second before anything moved.
 */
export const MAX_STAGGER_DELAY = 0.4;

/**
 * Entrance delay for the item at `index` of a staggered list: `base` plus
 * `step` per item, clamped to {@link MAX_STAGGER_DELAY}. Negative or
 * non-finite indexes fall back to the first item's delay.
 */
export function staggerDelay(index: number, step = 0.05, base = 0.05): number {
  const position = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  return Math.min(base + position * step, MAX_STAGGER_DELAY);
}

/**
 * The shared widget panel: one surface for every dashboard card, with padding
 * that breathes on small screens and a hover lift that is switched off when the
 * visitor asks for reduced motion.
 */
export const WIDGET_CARD_CLASS =
  "rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none sm:p-6";