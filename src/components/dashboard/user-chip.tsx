"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "@/components/auth/session-provider";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { getDisplayName, getProfileInitials } from "@/lib/auth/account";

export function UserChip() {
  const reduced = usePrefersReducedMotion();
  const { status, user } = useSession();

  if (status === "loading") {
    return (
      <div
        role="status"
        aria-label="Loading user"
        className="flex items-center gap-2"
      >
        <span className="h-8 w-8 animate-pulse rounded-full bg-surface-subtle" />
        <span className="hidden h-4 w-24 animate-pulse rounded-full bg-surface-subtle sm:block" />
      </div>
    );
  }

  if (!user) return null;

  const initials = getProfileInitials(user);
  const displayName = getDisplayName(user);

  return (
    <Link
      href="/dashboard/account"
      aria-label={`Account: ${displayName}`}
      className="group flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 transition-colors hover:bg-surface-subtle"
    >
      <motion.span
        initial={reduced ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-light text-[11px] font-semibold text-primary"
      >
        {initials}
      </motion.span>
      <span className="hidden max-w-[10rem] truncate text-sm font-medium text-text sm:block">
        {displayName}
      </span>
    </Link>
  );
}