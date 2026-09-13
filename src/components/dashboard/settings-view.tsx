"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Bell, Download, Palette, User } from "lucide-react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

const currencies = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "IDR", label: "Indonesian Rupiah (IDR)" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none";

function Toggle({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((current) => !current)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? "bg-primary" : "bg-surface-subtle"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
  index = 0,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  index?: number;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
          {icon}
        </span>
        <h2 className="text-base font-semibold text-text">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

export function SettingsView() {
  const [displayName, setDisplayName] = useState("Ada Lovelace");
  const [currency, setCurrency] = useState("USD");

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="September 2026"
          title="Settings"
          description="Your profile, preferences and notifications — all in one place."
        />

        <div className="flex flex-col gap-4">
          <SectionCard icon={<User className="h-4 w-4" />} title="Profile">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name">
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className={inputClassName}
                  placeholder="Your name"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  defaultValue="ada@example.com"
                  readOnly
                  className={`${inputClassName} opacity-60`}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Palette className="h-4 w-4" />}
            title="Preferences"
            index={1}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Field label="Currency">
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className={`${inputClassName} cursor-pointer`}
                >
                  {currencies.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Theme
                </span>
                <div className="flex h-10 items-center rounded-xl border border-border bg-surface px-3">
                  <DarkModeToggle />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Bell className="h-4 w-4" />}
            title="Notifications"
            index={2}
          >
            <div className="divide-y divide-border">
              <Toggle
                label="Budget alerts"
                description="Get told when a category is about to go over budget."
              />
              <Toggle
                label="Weekly summary"
                description="A short recap of your spending every Monday morning."
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={<Download className="h-4 w-4" />}
            title="Your data"
            index={3}
          >
            <p className="text-sm text-text-secondary">
              Export everything you need — coming later this year.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text"
            >
              <Download className="h-4 w-4" />
              Export data
            </button>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}