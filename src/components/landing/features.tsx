"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Landmark,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Wallet,
    title: "Track everything",
    description:
      "Log income and expenses in seconds and keep a complete history of every dollar.",
  },
  {
    icon: Landmark,
    title: "Monthly budgets",
    description:
      "Set a budget per category and follow your progress at a glance, month after month.",
  },
  {
    icon: PieChart,
    title: "Category insights",
    description:
      "See exactly where your money goes with clear breakdowns by category.",
  },
  {
    icon: BarChart3,
    title: "Clear reports",
    description:
      "Turn your history into charts and reports that make smart decisions easy.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description:
      "Your data is stored securely and only ever visible to you with row-level security.",
  },
  {
    icon: TrendingUp,
    title: "Build better habits",
    description:
      "Understand your trends over time and make progress toward your savings goals.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border py-28">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-block text-xs font-semibold tracking-widest text-text-muted">
            02
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Everything you need to master your finances
          </h2>
          <p className="mt-5 text-lg leading-8 text-text-secondary">
            A simple, powerful toolkit that grows with you — from your first
            budget to your best year yet.
          </p>
        </Reveal>
        <Stagger
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.08}
          delay={0.15}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={feature.title}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group rounded-2xl border border-border bg-surface p-7 transition-colors duration-300 hover:border-primary/30 hover:bg-primary-light/30 hover:shadow-md hover:shadow-primary/5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-subtle text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-text">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {feature.description}
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
