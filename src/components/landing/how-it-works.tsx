"use client";

import { motion } from "framer-motion";
import { Calculator, ListChecks, LineChart, type LucideIcon } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

interface Step {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: Calculator,
    number: "01",
    title: "Add your transactions",
    description:
      "Record income and expenses as they happen. Fast entry means you never miss one.",
  },
  {
    icon: ListChecks,
    number: "02",
    title: "Set monthly budgets",
    description:
      "Give each category a limit and let the app track how well you stick to it.",
  },
  {
    icon: LineChart,
    number: "03",
    title: "Watch your insights",
    description:
      "Check summaries, charts, and reports to spot trends and save more every month.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-surface-subtle py-20 transition-colors"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg leading-8 text-text-secondary">
            Get set up in minutes and see real clarity in your spending within
            the first month.
          </p>
        </Reveal>
        <Stagger
          className="mt-14 grid gap-6 md:grid-cols-3"
          stagger={0.1}
          delay={0.15}
        >
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <StaggerItem key={step.number}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative rounded-2xl border border-border bg-surface p-6 shadow-sm transition-colors duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <span className="absolute right-6 top-6 text-4xl font-bold text-border transition-colors duration-300 group-hover:text-primary/40">
                    {step.number}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-text text-surface transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-text">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {step.description}
                  </p>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
