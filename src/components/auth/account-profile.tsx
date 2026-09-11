"use client";

import { motion } from "framer-motion";
import { Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/components/auth/session-provider";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  getDisplayName,
  getProfileInitials,
  getShortId,
} from "@/lib/auth/account";

const cardClassName =
  "w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-black/5 dark:shadow-black/20";

export function AccountProfile() {
  const reduced = usePrefersReducedMotion();
  const { status, user } = useSession();

  if (status === "loading") {
    return (
      <div
        role="status"
        aria-label="Loading account"
        className={`${cardClassName} flex flex-col items-center gap-3`}
      >
        <span className="h-16 w-16 animate-pulse rounded-full bg-surface-subtle" />
        <span className="h-5 w-40 animate-pulse rounded-full bg-surface-subtle" />
        <span className="h-4 w-56 animate-pulse rounded-full bg-surface-subtle" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${cardClassName} flex flex-col items-center gap-3 text-center`}>
        <p className="text-sm text-text-secondary">You are not signed in.</p>
        <Link
          href="/login"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:opacity-90"
        >
          Log in
        </Link>
      </div>
    );
  }

  const initials = getProfileInitials(user);
  const displayName = getDisplayName(user);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={cardClassName}
    >
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-lg font-semibold text-primary">
          {initials}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Your account</p>
        </div>
      </div>

      <dl className="flex flex-col divide-y divide-border">
        <div className="flex items-center gap-3 pb-4">
          <Mail className="h-4 w-4 shrink-0 text-text-muted" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Email
            </dt>
            <dd className="text-sm font-medium text-text">
              {user.email ?? "Not set"}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-4">
          <ShieldCheck className="h-4 w-4 shrink-0 text-text-muted" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Member ID
            </dt>
            <dd className="text-sm font-medium text-text">{getShortId(user.id)}</dd>
          </div>
        </div>
      </dl>
    </motion.div>
  );
}