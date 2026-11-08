"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import {
  EASE,
  WIDGET_CARD_CLASS,
  staggerDelay,
} from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { SavingsGoalFormModal } from "@/components/dashboard/savings-goal-form-modal";
import { Snackbar } from "@/components/dashboard/snackbar";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useSavingsGoals } from "@/components/use-savings-goals";
import { formatCurrency, formatDateLabel } from "@/lib/finance/format";
import { DEFAULT_GOAL_COLOR } from "@/lib/finance/goal-form";
import { goalProgress, summarizeGoals } from "@/lib/finance/goals";
import { isoDate } from "@/lib/finance/period";
import { saveSavingsGoals } from "@/lib/storage/goals";
import type { NewSavingsGoal, SavingsGoal } from "@/types/goal";

const NOTICE_DURATION_MS = 5_000;

interface Notice {
  message: string;
  tone: "neutral" | "danger";
}

function newGoalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `goal-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function ProgressBar({
  percent,
  label,
  color,
  delay = 0,
}: {
  percent: number;
  label: string;
  color?: string;
  delay?: number;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2 overflow-hidden rounded-full bg-surface-subtle"
    >
      <motion.div
        initial={reduced ? false : { width: 0 }}
        animate={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        transition={{ duration: reduced ? 0 : 0.8, delay, ease: EASE }}
        style={color ? { backgroundColor: color } : undefined}
        className={`h-full rounded-full ${color ? "" : "bg-primary"}`}
      />
    </div>
  );
}

function GoalSummary({ goals }: { goals: readonly SavingsGoal[] }) {
  const reduced = usePrefersReducedMotion();
  const totals = useMemo(() => summarizeGoals(goals), [goals]);

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={`${WIDGET_CARD_CLASS} mb-6`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-text-muted">
            <Sparkles className="h-3.5 w-3.5" />
            All goals
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-text tabular-nums">
            {formatCurrency(totals.saved)}
            <span className="text-sm font-normal text-text-muted">
              {" "}
              of {formatCurrency(totals.target)}
            </span>
          </p>
        </div>
        <span className="rounded-full bg-primary-light px-3 py-1 text-sm font-semibold text-primary tabular-nums">
          {totals.percent}%
        </span>
      </div>

      <div className="mt-4">
        <ProgressBar percent={totals.percent} label="Overall savings progress" />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted">
        <span>
          {totals.tracked} {totals.tracked === 1 ? "goal" : "goals"} tracked
        </span>
        <span>{totals.completedCount} complete</span>
        <span>{formatCurrency(totals.remaining)} to go</span>
      </div>
    </motion.section>
  );
}

function GoalCard({
  goal,
  index,
  referenceDate,
  onEdit,
  onDelete,
}: {
  goal: SavingsGoal;
  index: number;
  referenceDate: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const progress = goalProgress(goal);
  const color = goal.color ?? DEFAULT_GOAL_COLOR;
  const targetLabel = goal.targetDate
    ? formatDateLabel(goal.targetDate, referenceDate)
    : null;

  return (
    <motion.li
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{
        duration: 0.4,
        delay: staggerDelay(index),
        ease: EASE,
      }}
      whileHover={reduced ? undefined : { y: -3 }}
      className={`${WIDGET_CARD_CLASS} flex flex-col`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            style={{ backgroundColor: `${color}1f`, color }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          >
            {progress.completed ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Target className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-text">
              {goal.name}
            </h3>
            {targetLabel ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                <CalendarDays className="h-3 w-3" />
                {targetLabel}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-text-muted">No target date</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${goal.name}`}
            title="Edit savings goal"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${goal.name}`}
            title="Delete savings goal"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-text tabular-nums">
            {formatCurrency(progress.saved)}
          </p>
          <p className="text-xs text-text-muted tabular-nums">
            of {formatCurrency(progress.target)}
          </p>
        </div>
        <span
          style={{ backgroundColor: `${color}1f`, color }}
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
        >
          {progress.percent}%
        </span>
      </div>

      <div className="mt-3">
        <ProgressBar
          percent={progress.percent}
          label={`${goal.name} progress`}
          color={color}
          delay={staggerDelay(index)}
        />
      </div>

      <p
        className={`mt-2 text-xs font-medium ${
          progress.completed ? "text-success" : "text-text-muted"
        }`}
      >
        {progress.completed
          ? "Goal reached"
          : `${formatCurrency(progress.remaining)} to go`}
      </p>
    </motion.li>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={`${WIDGET_CARD_CLASS} flex flex-col items-center gap-3 py-14 text-center`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Target className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-semibold text-text">No savings goals yet</p>
        <p className="mt-1 text-sm text-text-muted">
          Set a target and watch your progress grow.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none"
      >
        <Plus className="h-4 w-4" />
        Add savings goal
      </button>
    </motion.div>
  );
}

export function SavingsGoalsView() {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const hydrated = useIsClient();
  const goals = useSavingsGoals(userId);
  const referenceDate = useMemo(() => isoDate(new Date()), []);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  function commit(next: SavingsGoal[]) {
    saveSavingsGoals(userId, next);
  }

  function handleSaved(input: NewSavingsGoal) {
    if (editing) {
      commit(
        goals.map((goal) =>
          goal.id === editing.id ? { ...input, id: editing.id } : goal,
        ),
      );
      setNotice({ message: `Saved ${input.name}.`, tone: "neutral" });
      setEditing(null);
      return;
    }

    commit([...goals, { ...input, id: newGoalId() }]);
    setNotice({ message: `Added ${input.name}.`, tone: "neutral" });
    setAdding(false);
  }

  function handleDelete() {
    if (!deleting) return;

    commit(goals.filter((goal) => goal.id !== deleting.id));
    setNotice({ message: `Deleted ${deleting.name}.`, tone: "neutral" });
    setDeleting(null);
  }

  function closeForm() {
    setAdding(false);
    setEditing(null);
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="Save"
          title="Savings goals"
          description="Put money aside for the things you are working toward. Goals are saved on this device until sync lands."
          action={
            <button
              type="button"
              onClick={() => setAdding(true)}
              disabled={!hydrated}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none"
            >
              <Plus className="h-4 w-4" />
              New goal
            </button>
          }
        />

        <AnimatePresence mode="wait">
          {!hydrated ? (
            <motion.div
              key="loading"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`${WIDGET_CARD_CLASS} py-14 text-center`}
            >
              <p className="text-sm text-text-muted">Loading your goals…</p>
            </motion.div>
          ) : goals.length === 0 ? (
            <motion.div
              key="empty"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState onAdd={() => setAdding(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GoalSummary goals={goals} />
              <motion.ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {goals.map((goal, index) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      index={index}
                      referenceDate={referenceDate}
                      onEdit={() => setEditing(goal)}
                      onDelete={() => setDeleting(goal)}
                    />
                  ))}
                </AnimatePresence>
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(adding || editing !== null) && (
          <SavingsGoalFormModal
            key={editing?.id ?? "new-goal"}
            goal={editing ?? undefined}
            onClose={closeForm}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting !== null && (
          <ConfirmDialog
            title="Delete this savings goal?"
            description={`“${deleting.name}” and its progress will be removed.`}
            confirmLabel="Delete goal"
            cancelLabel="Keep it"
            tone="danger"
            onConfirm={handleDelete}
            onCancel={() => setDeleting(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice !== null && (
          <Snackbar
            key={notice.message}
            message={notice.message}
            tone={notice.tone}
            duration={NOTICE_DURATION_MS}
            onDismiss={() => setNotice(null)}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
