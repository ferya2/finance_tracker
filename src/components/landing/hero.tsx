import {
  ArrowRight,
  ChartPie,
  Sparkles,
  Wallet,
} from "lucide-react";

function PreviewCard() {
  const rows = [
    { label: "Income", value: "+$4,280", positive: true },
    { label: "Expenses", value: "-$1,640", positive: false },
    { label: "Saved", value: "$2,640", positive: true },
  ];

  return (
    <div
      aria-hidden
      className="relative hidden w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-xl shadow-zinc-900/10 backdrop-blur lg:block dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          August
        </p>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Sparkles className="h-3 w-3" />
          On track
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        $2,640<span className="ml-1 text-sm font-normal text-zinc-400">saved</span>
      </p>
      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60"
          >
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {row.label}
            </span>
            <span
              className={`text-sm font-semibold ${
                row.positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
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
            className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              style={{ width: `${width}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.18),transparent_60%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-6 pb-20 pt-24 sm:pt-32 lg:flex-row lg:items-center lg:gap-16 lg:pb-28 lg:pt-36">
        <div className="flex max-w-2xl flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Wallet className="h-3.5 w-3.5" />
            Track. Budget. Grow.
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl sm:leading-tight lg:text-6xl dark:text-zinc-50">
            Take control of your money,
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {" "}
              beautifully.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Finance Tracker makes it effortless to log income and expenses, set
            monthly budgets, and understand your spending with clear, modern
            reports.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-900 px-7 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start tracking
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 px-7 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChartPie className="h-4 w-4" />
              See features
            </a>
          </div>
        </div>
        <PreviewCard />
      </div>
    </section>
  );
}