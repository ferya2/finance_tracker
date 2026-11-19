"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  BarChart3,
  CornerDownLeft,
  LayoutDashboard,
  Loader2,
  PiggyBank,
  Plus,
  Search,
  Settings,
  Sparkles,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EASE, staggerDelay } from "@/components/dashboard/motion";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { Snackbar } from "@/components/dashboard/snackbar";
import { useIsClient } from "@/components/use-is-client";
import { USER_DATA_CHANGED_EVENT } from "@/components/use-user-data";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  filterPaletteCommands,
  isPaletteShortcut,
  movePaletteSelection,
  type PaletteCommand,
} from "@/lib/finance/command-palette";
import { isoDate } from "@/lib/finance/period";
import {
  categoriesForType,
  emptyTransactionForm,
  toNewTransaction,
  validateTransactionForm,
  type TransactionFormValues,
} from "@/lib/finance/transaction-form";
import type { TransactionErrors } from "@/lib/finance/transaction";
import { listCategories } from "@/lib/supabase/categories";
import { createTransaction } from "@/lib/supabase/transactions";
import type { Category } from "@/types/category";
import type { TransactionType } from "@/types/transaction";

interface Command extends PaletteCommand {
  icon: LucideIcon;
  href?: string;
}

const COMMANDS: readonly Command[] = [
  {
    id: "add-transaction",
    label: "Add transaction",
    description: "Quick add an income or expense",
    keywords: ["new", "quick", "expense", "income"],
    icon: Plus,
  },
  {
    id: "go-transactions",
    label: "Go to Transactions",
    description: "Browse your transaction history",
    keywords: ["list", "history"],
    icon: ArrowLeftRight,
    href: "/dashboard/transactions",
  },
  {
    id: "go-dashboard",
    label: "Go to Dashboard",
    description: "See your balance and overview",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "go-categories",
    label: "Go to Categories",
    description: "Manage your categories",
    icon: Tag,
    href: "/dashboard/categories",
  },
  {
    id: "go-budgets",
    label: "Go to Budgets",
    description: "Track your monthly limits",
    icon: PiggyBank,
    href: "/dashboard/budgets",
  },
  {
    id: "go-reports",
    label: "Go to Reports",
    description: "Explore charts and reports",
    icon: BarChart3,
    href: "/dashboard/reports",
  },
  {
    id: "go-insights",
    label: "Go to Insights",
    description: "Spot trends in your spending",
    icon: Sparkles,
    href: "/dashboard/insights",
  },
  {
    id: "go-settings",
    label: "Go to Settings",
    description: "Preferences and currency",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

const typeOptions: ReadonlyArray<{ value: TransactionType; label: string }> = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

const inputClassName =
  "w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20";

type SaveStatus =
  | { type: "idle" }
  | { type: "saving" }
  | { type: "error"; message: string };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

export function CommandPalette() {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const router = useRouter();
  const referenceDate = useMemo(() => isoDate(new Date()), []);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<"commands" | "add">("commands");
  const [values, setValues] = useState<TransactionFormValues>(() =>
    emptyTransactionForm(referenceDate),
  );
  const [fieldErrors, setFieldErrors] = useState<TransactionErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<SaveStatus>({ type: "idle" });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(() => filterPaletteCommands(COMMANDS, query), [query]);
  const options = useMemo(
    () => categoriesForType(categories, values.type),
    [categories, values.type],
  );

  const openPalette = useCallback(() => {
    setQuery("");
    setSelected(0);
    setMode("commands");
    setValues(emptyTransactionForm(referenceDate));
    setFieldErrors({});
    setSubmitted(false);
    setStatus({ type: "idle" });
    setCategoriesLoading(true);
    setOpen(true);
  }, [referenceDate]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || !isPaletteShortcut(event)) return;
      event.preventDefault();
      openPalette();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openPalette]);

  useEffect(() => {
    if (!open || !isClient) return;

    let active = true;
    void listCategories().then(({ data, error }) => {
      if (!active) return;
      setCategories(error ? [] : (data ?? []));
      setCategoriesLoading(false);
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      active = false;
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isClient]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || !isClient) return;
    if (mode === "commands") searchRef.current?.focus();
    else amountRef.current?.focus();
  }, [open, mode, isClient]);

  function selectCommand(command: Command) {
    if (command.href) {
      setOpen(false);
      router.push(command.href);
      return;
    }
    setMode("add");
    setFieldErrors({});
    setSubmitted(false);
    setStatus({ type: "idle" });
  }

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((current) => movePaletteSelection(current, 1, commands.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((current) => movePaletteSelection(current, -1, commands.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = commands[selected];
      if (command) selectCommand(command);
    }
  }

  function update(patch: Partial<TransactionFormValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    if (status.type === "error") setStatus({ type: "idle" });
    if (submitted) setFieldErrors(validateTransactionForm(next));
  }

  function handleTypeChange(type: TransactionType) {
    const available = categoriesForType(categories, type);
    const stillValid = available.some((category) => category.id === values.categoryId);
    update({ type, categoryId: stillValid ? values.categoryId : "" });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const errors = validateTransactionForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus({ type: "saving" });
    const { data, error } = await createTransaction(toNewTransaction(values));
    if (error || !data) {
      setStatus({
        type: "error",
        message: error?.message ?? "Could not save the transaction. Try again.",
      });
      return;
    }

    window.dispatchEvent(new Event(USER_DATA_CHANGED_EVENT));
    setOpen(false);
    setToast("Transaction added");
  }

  if (!isClient) return null;

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        aria-label="Open command palette"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-3 text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Search className="h-4 w-4" />
        <span className="hidden text-xs font-medium sm:inline">Quick actions</span>
        <kbd className="hidden rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-text-muted lg:inline">
          Ctrl K
        </kbd>
      </button>

      {createPortal(
        <>
          <AnimatePresence>
            {open && (
              <motion.div
                key="command-palette"
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]"
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
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              initial={reduced ? false : { y: -16, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={reduced ? undefined : { y: -12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/10 dark:shadow-black/40"
            >
              {mode === "commands" ? (
                <>
                  <div className="flex items-center gap-3 border-b border-border px-4">
                    <Search className="h-5 w-5 shrink-0 text-text-muted" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setSelected(0);
                      }}
                      onKeyDown={handleSearchKeyDown}
                      role="combobox"
                      aria-label="Search commands"
                      aria-expanded="true"
                      aria-controls="command-palette-list"
                      aria-activedescendant={
                        commands[selected] ? `command-${commands[selected].id}` : undefined
                      }
                      placeholder="Search actions and pages…"
                      autoComplete="off"
                      className="h-14 w-full bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close command palette"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <ul
                    id="command-palette-list"
                    role="listbox"
                    aria-label="Commands"
                    className="max-h-[min(60vh,420px)] overflow-y-auto p-2"
                  >
                    {commands.map((command, index) => {
                      const Icon = command.icon;
                      const active = index === selected;
                      return (
                        <motion.li
                          key={command.id}
                          id={`command-${command.id}`}
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setSelected(index)}
                          initial={reduced ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: reduced ? 0 : staggerDelay(index, 0.02, 0),
                            ease: EASE,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => selectCommand(command)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                              active ? "bg-primary-light" : "hover:bg-surface-subtle"
                            }`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-secondary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-text">
                                {command.label}
                              </span>
                              <span className="block truncate text-xs text-text-secondary">
                                {command.description}
                              </span>
                            </span>
                            {active && (
                              <CornerDownLeft className="h-4 w-4 shrink-0 text-text-muted" />
                            )}
                          </button>
                        </motion.li>
                      );
                    })}
                    {commands.length === 0 && (
                      <li className="px-3 py-8 text-center text-sm text-text-secondary">
                        No commands found.
                      </li>
                    )}
                  </ul>

                  <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <ArrowUp className="h-3 w-3" />
                      <ArrowDown className="h-3 w-3" />
                      to navigate · ↵ to select
                    </span>
                    <span>esc to close</span>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSave} noValidate className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-text">
                        Quick add transaction
                      </h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        Record an income or expense without leaving this page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close command palette"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-text">Type</span>
                    <SegmentedControl
                      name="quick-add-type"
                      ariaLabel="Transaction type"
                      options={typeOptions}
                      value={values.type}
                      onChange={handleTypeChange}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="quick-add-amount" className="text-sm font-medium text-text">
                      Amount
                    </label>
                    <input
                      id="quick-add-amount"
                      ref={amountRef}
                      value={values.amount}
                      onChange={(event) => update({ amount: event.target.value })}
                      inputMode="decimal"
                      placeholder="0.00"
                      autoComplete="off"
                      aria-invalid={Boolean(fieldErrors.amount)}
                      aria-describedby={
                        fieldErrors.amount ? "quick-add-amount-error" : undefined
                      }
                      className={inputClassName}
                    />
                    <FieldError id="quick-add-amount-error" message={fieldErrors.amount} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="quick-add-category" className="text-sm font-medium text-text">
                      Category
                    </label>
                    <select
                      id="quick-add-category"
                      value={values.categoryId}
                      onChange={(event) => update({ categoryId: event.target.value })}
                      aria-invalid={Boolean(fieldErrors.categoryId)}
                      aria-describedby={
                        fieldErrors.categoryId ? "quick-add-category-error" : undefined
                      }
                      className={inputClassName}
                    >
                      <option value="">
                        {categoriesLoading ? "Loading categories…" : "Choose a category"}
                      </option>
                      {options.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <FieldError
                      id="quick-add-category-error"
                      message={fieldErrors.categoryId}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="quick-add-date" className="text-sm font-medium text-text">
                      Date
                    </label>
                    <input
                      id="quick-add-date"
                      type="date"
                      value={values.occurredOn}
                      onChange={(event) => update({ occurredOn: event.target.value })}
                      className={inputClassName}
                    />
                    <FieldError id="quick-add-date-error" message={fieldErrors.occurredOn} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="quick-add-note" className="text-sm font-medium text-text">
                      Note <span className="font-normal text-text-muted">optional</span>
                    </label>
                    <input
                      id="quick-add-note"
                      value={values.note}
                      onChange={(event) => update({ note: event.target.value })}
                      placeholder="What was it for?"
                      autoComplete="off"
                      className={inputClassName}
                    />
                    <FieldError id="quick-add-note-error" message={fieldErrors.note} />
                  </div>

                  <AnimatePresence initial={false}>
                    {status.type === "error" && (
                      <motion.p
                        initial={reduced ? false : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduced ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        role="alert"
                        className="flex items-start gap-2 rounded-lg bg-danger-subtle px-3 py-2.5 text-sm text-danger"
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        {status.message}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      disabled={status.type === "saving"}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={status.type === "saving"}
                      whileHover={reduced ? undefined : { scale: 1.01 }}
                      whileTap={reduced ? undefined : { scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-opacity disabled:opacity-70"
                    >
                      {status.type === "saving" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save transaction"
                      )}
                    </motion.button>
                  </div>
                </form>
              )}
              </motion.div>
            </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toast && <Snackbar message={toast} onDismiss={() => setToast(null)} />}
          </AnimatePresence>
        </>,
        document.body,
      )}
    </>
  );
}
