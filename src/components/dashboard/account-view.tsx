"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, PiggyBank, Tags } from "lucide-react";
import { type ReactNode } from "react";
import { AccountProfile } from "@/components/auth/account-profile";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { DUMMY_BUDGETS, DUMMY_CATEGORIES, DUMMY_TRANSACTIONS } from "@/lib/finance/dummy";

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
        {icon}
      </span>
      <div>
        <p className="text-lg font-semibold leading-tight text-text tabular-nums">
          {value}
        </p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </motion.div>
  );
}

export function AccountView() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="Your space"
          title="Account"
          description="Your identity, your data and how you use Finance Tracker."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            label="Transactions"
            value={DUMMY_TRANSACTIONS.length}
            icon={<ArrowLeftRight className="h-4 w-4" />}
          />
          <StatTile
            label="Categories"
            value={DUMMY_CATEGORIES.length}
            icon={<Tags className="h-4 w-4" />}
          />
          <StatTile
            label="Budgets"
            value={DUMMY_BUDGETS.length}
            icon={<PiggyBank className="h-4 w-4" />}
          />
        </div>

        <div className="mt-6 flex justify-center">
          <AccountProfile />
        </div>
      </div>
    </PageShell>
  );
}