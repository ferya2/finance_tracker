"use client";

import dynamic from "next/dynamic";
import {
  ChartPie,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/button";
import { Magnetic } from "@/components/magnetic";
import { HeroReveal } from "@/components/motion";
import { useMediaQuery } from "@/components/use-media-query";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

const HeroScene = dynamic(
  () =>
    import("@/components/3d/hero-scene").then((m) => m.HeroScene),
  { ssr: false },
);

function PreviewCard() {
  const rows = [
    { label: "Income", value: "+$4,280", positive: true },
    { label: "Expenses", value: "-$1,640", positive: false },
    { label: "Saved", value: "$2,640", positive: true },
  ];

  return (
    <HeroReveal delay={0.45} className="w-full max-w-sm">
      <div
        aria-hidden
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface/90 p-5 shadow-xl shadow-black/8 backdrop-blur-md"
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
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reduced = usePrefersReducedMotion();
  const showScene = isDesktop && !reduced;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)] bg-[radial-gradient(ellipse_at_top,var(--color-primary-light),transparent_60%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-14 px-6 pb-24 pt-28 sm:pt-36 lg:flex-row lg:items-center lg:gap-20 lg:pb-32 lg:pt-40">
        <div className="flex max-w-2xl flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <HeroReveal delay={0.05}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-xs font-medium text-primary">
              <Wallet className="h-3.5 w-3.5" />
              Track. Budget. Grow.
            </span>
          </HeroReveal>

          <HeroReveal delay={0.15}>
            <h1 className="mt-7 text-4xl font-bold leading-[1.1] tracking-tight text-text sm:text-5xl lg:text-6xl">
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
              <Magnetic>
                <Button href="#how-it-works" arrow>
                  Start tracking
                </Button>
              </Magnetic>
              <Button href="#features" variant="secondary" icon={ChartPie}>
                See features
              </Button>
            </div>
          </HeroReveal>
        </div>
        <div className="relative hidden w-full max-w-sm lg:block">
          {showScene && <HeroScene className="absolute inset-0 h-full w-full" />}
          <PreviewCard />
        </div>
      </div>
    </section>
  );
}
