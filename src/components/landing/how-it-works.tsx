import { Calculator, ListChecks, LineChart, type LucideIcon } from "lucide-react";

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
      className="bg-zinc-50 py-20 transition-colors dark:bg-zinc-900/40"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            How it works
          </h2>
          <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Get set up in minutes and see real clarity in your spending within
            the first month.
          </p>
        </div>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className="relative rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="absolute right-6 top-6 text-4xl font-bold text-zinc-100 dark:text-zinc-800">
                  {step.number}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}