"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  OPEN_COMMAND_PALETTE_EVENT,
  type CommandPaletteOpenDetail,
} from "@/components/dashboard/command-palette-event";
import { EASE, staggerDelay } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  formatShortcutKeys,
  isEditableTarget,
  isShortcutPrefix,
  KEYBOARD_SHORTCUTS,
  matchShortcut,
  MAX_SHORTCUT_SEQUENCE_LENGTH,
  normalizeShortcutKey,
  SHORTCUT_GROUP_ORDER,
  type EditableTarget,
} from "@/lib/finance/keyboard-shortcuts";

export function KeyboardShortcuts() {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSequence = useCallback(() => {
    sequenceRef.current = [];
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  useEffect(() => () => resetSequence(), [resetSequence]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || open) return;
      if (isEditableTarget(event.target as unknown as EditableTarget | null)) return;

      const token = normalizeShortcutKey(event);
      const next = [...sequenceRef.current, token].slice(-MAX_SHORTCUT_SEQUENCE_LENGTH);
      const shortcut = matchShortcut(next);

      if (shortcut) {
        event.preventDefault();
        resetSequence();
        if (shortcut.href) {
          router.push(shortcut.href);
        } else if (shortcut.id === "help") {
          setOpen(true);
        } else {
          const mode: CommandPaletteOpenDetail["mode"] =
            shortcut.id === "quick-add" ? "add" : "commands";
          window.dispatchEvent(
            new CustomEvent<CommandPaletteOpenDetail>(OPEN_COMMAND_PALETTE_EVENT, {
              detail: { mode },
            }),
          );
        }
        return;
      }

      if (isShortcutPrefix(next)) {
        sequenceRef.current = next;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(resetSequence, 1000);
      } else {
        resetSequence();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, resetSequence, router]);

  useEffect(() => {
    if (!open || !isClient) return;

    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isClient]);

  if (!isClient) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Keyboard shortcuts"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Keyboard className="h-4 w-4" />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="keyboard-shortcuts"
              className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Keyboard shortcuts"
                tabIndex={-1}
                initial={reduced ? false : { y: 12, scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={reduced ? undefined : { y: 8, scale: 0.99 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/10 outline-none dark:shadow-black/40"
              >
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-text">
                      Keyboard shortcuts
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      Move around and take action without leaving the keyboard.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close keyboard shortcuts"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-5 overflow-y-auto px-3 py-4 sm:px-5">
                  {SHORTCUT_GROUP_ORDER.map((group) => (
                    <section key={group}>
                      <h3 className="px-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                        {group}
                      </h3>
                      <ul className="mt-2 flex flex-col gap-0.5">
                        {KEYBOARD_SHORTCUTS.filter(
                          (shortcut) => shortcut.group === group,
                        ).map((shortcut, index) => (
                          <motion.li
                            key={shortcut.id}
                            initial={reduced ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.2,
                              delay: reduced ? 0 : staggerDelay(index, 0.02, 0),
                              ease: EASE,
                            }}
                            className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 transition-colors hover:bg-surface-subtle"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-text">
                                {shortcut.label}
                              </span>
                              <span className="block truncate text-xs text-text-secondary">
                                {shortcut.description}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1">
                              {formatShortcutKeys(shortcut.sequence).map((key, keyIndex) => (
                                <kbd
                                  key={`${key}-${keyIndex}`}
                                  className="rounded-md border border-border bg-surface-muted px-2 py-1 text-[11px] font-semibold text-text-secondary"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>

                <p className="border-t border-border px-5 py-3 text-xs text-text-muted">
                  Press <kbd className="font-semibold text-text-secondary">G</kbd> then a
                  letter to jump to a page · use <kbd className="font-semibold text-text-secondary">Ctrl/⌘ K</kbd>{" "}
                  for quick actions
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
