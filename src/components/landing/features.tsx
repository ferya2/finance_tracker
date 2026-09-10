import {
  BarChart3,
  Landmark,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

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
    <section id="features" className="border-t border-zinc-200 py-20 dark:border-zinc-800">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Everything you need to master your finances
          </h2>
          <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            A simple, powerful toolkit that grows with you — from your first
            budget to your best year yet.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}