import { Wallet } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-12 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Wallet className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Finance Tracker
          </p>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Track income, budget smarter, and reach your goals.
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          © {new Date().getFullYear()} Finance Tracker. All rights reserved.
        </p>
      </div>
    </footer>
  );
}