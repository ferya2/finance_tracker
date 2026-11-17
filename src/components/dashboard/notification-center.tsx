"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/components/auth/session-provider";
import { useCurrency } from "@/components/currency-provider";
import { EASE, staggerDelay } from "@/components/dashboard/motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useRecurringEntries } from "@/components/use-recurring-entries";
import { useUserData } from "@/components/use-user-data";
import { buildBudgetSummaries } from "@/lib/finance/budget-summary";
import {
  buildNotifications,
  type AppNotification,
  type NotificationTone,
} from "@/lib/finance/notifications";
import { currentPeriod, isoDate } from "@/lib/finance/period";

const toneIconClass: Record<NotificationTone, string> = {
  danger: "bg-danger-subtle text-danger",
  warning: "bg-warning-light text-warning",
  info: "bg-primary-light text-primary",
};

function NotificationIcon({ tone }: { tone: NotificationTone }) {
  const Icon = tone === "info" ? CalendarClock : AlertTriangle;
  return (
    <span
      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toneIconClass[tone]}`}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function NotificationRow({
  notification,
  index,
  onNavigate,
}: {
  notification: AppNotification;
  index: number;
  onNavigate: () => void;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: staggerDelay(index, 0.04, 0.03), ease: EASE }}
    >
      <Link
        href={notification.href}
        onClick={onNavigate}
        className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface-subtle focus-visible:bg-surface-subtle focus-visible:outline-none"
      >
        <NotificationIcon tone={notification.tone} />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-text">
            {notification.title}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-text-secondary">
            {notification.message}
          </span>
        </span>
      </Link>
    </motion.li>
  );
}

function NotificationMenu({ userId }: { userId: string }) {
  const reduced = usePrefersReducedMotion();
  const { currency } = useCurrency();
  const { status, data } = useUserData();
  const recurring = useRecurringEntries(userId);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => isoDate(now), [now]);

  const notifications = useMemo(() => {
    if (!data) return [];
    return buildNotifications({
      budgets: buildBudgetSummaries(
        data.budgets,
        data.transactions,
        data.categories,
        currentPeriod(now),
      ),
      recurring,
      categories: data.categories,
      today,
      currency,
    });
  }, [data, recurring, today, currency, now]);

  const visible = notifications.filter(
    (notification) => !dismissed.has(notification.id),
  );
  const count = visible.length;
  const loading = status === "loading";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={count > 0 ? `Notifications (${count})` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        whileHover={reduced ? undefined : { scale: 1.05 }}
        whileTap={reduced ? undefined : { scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <motion.span
            key={count}
            initial={reduced ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white"
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={reduced ? false : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/10 dark:shadow-black/50"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-text">Notifications</p>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setDismissed((current) => {
                      const next = new Set(current);
                      for (const notification of visible) {
                        next.add(notification.id);
                      }
                      return next;
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Clear all
                </button>
              )}
            </div>

            {loading ? (
              <div
                role="status"
                aria-label="Loading notifications"
                className="space-y-3 px-4 py-4"
              >
                {[0, 1].map((row) => (
                  <div key={row} className="flex gap-3">
                    <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-surface-subtle" />
                    <span className="flex-1 space-y-2 py-1">
                      <span className="block h-3 w-2/3 animate-pulse rounded-full bg-surface-subtle" />
                      <span className="block h-3 w-1/2 animate-pulse rounded-full bg-surface-subtle" />
                    </span>
                  </div>
                ))}
              </div>
            ) : count === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
                  <Inbox className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-text">All caught up</p>
                <p className="text-xs text-text-muted">
                  Budget alerts and upcoming plans will appear here.
                </p>
              </div>
            ) : (
              <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                {visible.map((notification, index) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * The header bell that opens the in-app notification center. Budget warnings
 * and the next week's recurring plans are derived from the same data the pages
 * already load, so there is no separate notifications table to keep in sync.
 */
export function NotificationCenter() {
  const { status, user } = useSession();

  if (status === "loading" || !user) return null;

  return <NotificationMenu userId={user.id} />;
}
