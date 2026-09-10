"use client";

import {
  ArrowRight,
  ChartPie,
  Sparkles,
  Wallet,
} from "lucide-react";
import { HeroReveal } from "@/components/motion";

function PreviewCard() {
  const rows = [
    { label: "Income", value: "+$4,280", positive: true },
    { label: "Expenses", value: "-$1,640", positive: false },
    { label: "Saved", value: "$2,640", positive: true },
  ];

  return (
    <HeroReveal delay={0.45} className="hidden w-full max-w-sm lg:block">
      <div
        aria-hidden
        className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 p-5 shadow-xl shadow-black/10 backdrop-blur"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-secondary">
            August
          </p>
          <span className="flex items-center gap-1 rounded-full bg-success-subtle px-2.5 py-0.5 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            On track
          </span>
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-text">
          $2,640<span className="ml-1 text-sm font-normal text-text-muted">saved</span>
        </p>
        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg bg-surface-subtle px-3 py-2"
            >
              <span className="text-sm text-text-secondary">
                {row.label}
              </span>
              <span
                className={`text-sm font-semibold ${
                  row.positive ? "text-success" : "text-danger"
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {[64, 82, 48].map((width, index) => (
            <div
              key={index}
              className="h-1.5 rounded-full bg-surface-subtle"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${width}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </HeroReveal>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)] bg-[radial-gradient(ellipse_at_top,var(--color-primary-light),transparent_60%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-6 pb-20 pt-24 sm:pt-32 lg:flex-row lg:items-center lg:gap-16 lg:pb-28 lg:pt-36">
        <div className="flex max-w-2xl flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <HeroReveal delay={0.05}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-xs font-medium text-primary">
              <Wallet className="h-3.5 w-3.5" />
              Track. Budget. Grow.
            </span>
          </HeroReveal>

          <HeroReveal delay={0.15}>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-text sm:text-5xl sm:leading-tight lg:text-6xl">
              Take control of your money,
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {" "}
                beautifully.
              </span>
            </h1>
          </HeroReveal>

          <HeroReveal delay={0.25}>
            <p className="mt-5 max-w-xl text-lg leading-8 text-text-secondary">
              Finance Tracker makes it effortless to log income and expenses, set
              monthly budgets, and understand your spending with clear, modern
              reports.
            </p>
          </HeroReveal>

          <HeroReveal delay={0.35}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
              >
                Start tracking
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#features"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-7 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle"
              >
                <ChartPie className="h-4 w-4" />
                See features
              </a>
            </div>
          </HeroReveal>
        </div>
        <PreviewCard />
      </div>
    </section>
  );
}
