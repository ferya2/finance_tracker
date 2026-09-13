"use client";

import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { DUMMY_SUMMARY } from "@/lib/finance/dummy";

export function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          September 2026
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          Overview
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          A snapshot of your money this month — updated as you go.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Balance"
          value={DUMMY_SUMMARY.totalBalance}
          caption="Current balance"
          icon={Wallet}
          tone="primary"
        />
        <SummaryCard
          label="Income"
          value={DUMMY_SUMMARY.monthlyIncome}
          caption="This month"
          icon={TrendingUp}
          tone="success"
          delay={0.05}
        />
        <SummaryCard
          label="Expense"
          value={DUMMY_SUMMARY.monthlyExpense}
          caption="This month"
          icon={TrendingDown}
          tone="danger"
          delay={0.1}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentTransactions />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <BudgetProgress />
          <CategoryBreakdown />
        </div>
      </div>
    </div>
  );
}