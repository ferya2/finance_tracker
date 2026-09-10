"use client";

import { Wallet } from "lucide-react";
import { Reveal } from "@/components/motion";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border py-16">
      <Reveal variant="fadeIn">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Wallet className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-text">
              Finance Tracker
            </p>
          </div>
          <p className="text-sm text-text-secondary">
            Track income, budget smarter, and reach your goals.
          </p>
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} Finance Tracker. All rights reserved.
          </p>
        </div>
      </Reveal>
    </footer>
  );
}
