"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Tags,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { useOnboardingCompleted } from "@/components/use-onboarding";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import {
  isFirstRun,
  nextOnboardingStep,
  previousOnboardingStep,
  type OnboardingStepId,
} from "@/lib/finance/onboarding";
import { saveOnboardingCompleted } from "@/lib/storage/onboarding";
import { seedDefaultCategories } from "@/lib/supabase/categories";

interface Step {
  id: OnboardingStepId;
  label: string;
  title: string;
  body: string;
  action: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  {
    id: "welcome",
    label: "Welcome",
    title: "Welcome to Finance Tracker",
    body: "A calm place to see where your money goes. In two short steps we'll get your account ready, then you can start tracking in seconds.",
    action: "Get started",
    icon: Sparkles,
  },
  {
    id: "categories",
    label: "Categories",
    title: "Start with the essentials",
    body: "We'll add eight starter categories — from salary and housing to food and transport. You can rename, recolour or remove any of them later.",
    action: "Add starter categories",
    icon: Tags,
  },
  {
    id: "ready",
    label: "Ready",
    title: "You're ready to track",
    body: "Add your first income or expense whenever you like. Your dashboard, budgets and reports will fill in as you go.",
    action: "Finish setup",
    icon: Check,
  },
];

function FirstRunWizard({ userId }: { userId: string }) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const { status, data } = useUserData();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const visible = isClient && status === "ready" && isFirstRun(data);

  const finish = useCallback(() => {
    saveOnboardingCompleted(userId);
  }, [userId]);

  useEffect(() => {
    if (visible) panelRef.current?.focus();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !busy) {
        finish();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, finish, visible]);

  if (!visible) return null;

  const current = steps[step];

  async function handleNext() {
    setError(null);

    if (current.id === "ready") {
      finish();
      return;
    }

    if (current.id === "categories") {
      setBusy(true);
      const result = await seedDefaultCategories();
      setBusy(false);
      if (result.error) {
        setError("Couldn't add starter categories. Please try again.");
        return;
      }
    }

    setStep(nextOnboardingStep(step));
  }

  function handleBack() {
    setError(null);
    setStep(previousOnboardingStep(step));
  }

  const Icon = current.icon;

  return createPortal(
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        onClick={busy ? undefined : finish}
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          aria-describedby="onboarding-body"
          tabIndex={-1}
          initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="pointer-events-auto w-full max-w-md rounded-t-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/10 outline-none motion-reduce:transition-none sm:rounded-3xl dark:shadow-black/40"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {String(step + 1).padStart(2, "0")} / {current.label}
              </p>
              <div
                role="progressbar"
                aria-label="Setup progress"
                aria-valuemin={1}
                aria-valuemax={steps.length}
                aria-valuenow={step + 1}
                className="mt-3 flex items-center gap-1.5"
              >
                {steps.map((item, index) => (
                  <span
                    key={item.id}
                    aria-hidden="true"
                    className={`h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                      index <= step ? "w-7 bg-primary" : "w-3 bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={finish}
              disabled={busy}
              aria-label="Skip setup"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text disabled:opacity-60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={reduced ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease: EASE }}
            >
              <span className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h2
                id="onboarding-title"
                className="mt-4 text-xl font-semibold tracking-tight text-text"
              >
                {current.title}
              </h2>
              <p
                id="onboarding-body"
                className="mt-2 text-sm leading-relaxed text-text-secondary"
              >
                {current.body}
              </p>
              {current.id === "ready" && (
                <Link
                  href="/dashboard/transactions"
                  onClick={finish}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
                >
                  Add your first transaction
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {error && (
              <motion.p
                initial={reduced ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-lg bg-danger-subtle px-3 py-2.5 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={busy}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text disabled:opacity-60"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={finish}
                disabled={busy}
                className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-text-muted transition-colors hover:bg-surface-subtle hover:text-text disabled:opacity-60"
              >
                Skip
              </button>
              <motion.button
                type="button"
                onClick={() => void handleNext()}
                disabled={busy}
                whileHover={reduced ? undefined : { scale: 1.01 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-opacity disabled:opacity-70"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  current.action
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}

/**
 * A first-run guide that appears over the dashboard once the user's data has
 * loaded. It seeds starter categories on the user's behalf and remembers the
 * completion per user so a returning account is never interrupted again.
 */
export function OnboardingWizard({ userId }: { userId: string }) {
  const completed = useOnboardingCompleted(userId);
  if (completed) return null;

  return <FirstRunWizard userId={userId} />;
}
