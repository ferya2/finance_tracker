"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Download, Loader2, Palette, Save, User } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { useCurrency } from "@/components/currency-provider";
import {
  DarkModeToggle,
  getTheme,
  setAccentColor,
  useAccentColor,
} from "@/components/dark-mode-toggle";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { getDisplayName } from "@/lib/auth/account";
import { normalizeDisplayName } from "@/lib/auth/settings";
import { ACCENT_PALETTES } from "@/lib/finance/accent-color";
import { SUPPORTED_CURRENCIES } from "@/lib/finance/currency";
import { sanitizeCurrencyCode } from "@/lib/finance/currency-settings";
import { updateUserSettings } from "@/lib/supabase/client";

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

interface Feedback {
  tone: "success" | "error";
  message: string;
}

export function SettingsView() {
  const { user } = useSession();
  const { currency, setCurrency, format } = useCurrency();
  const accentColor = useAccentColor();
  const reduced = usePrefersReducedMotion();
  const profileName = user ? getDisplayName(user) : "";
  const profileKey = user ? `${user.id}:${profileName}` : "";
  const appliedProfile = useRef("");
  const [displayName, setDisplayName] = useState(profileName);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!profileKey || appliedProfile.current === profileKey) return;
    appliedProfile.current = profileKey;
    setDisplayName(profileName);
  }, [profileKey, profileName]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = normalizeDisplayName(displayName);
    if (!name) {
      setFeedback({ tone: "error", message: "Enter a display name." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const { error } = await updateUserSettings({
        displayName: name,
        currency,
        theme: getTheme(),
        accentColor,
      });
      if (error) throw error;
      setFeedback({ tone: "success", message: "Settings saved." });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not save settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="September 2026"
          title="Settings"
          description="Your profile, preferences and notifications — all in one place."
        />

        <form onSubmit={handleSave} className="flex flex-col gap-4">
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
                  value={user?.email ?? ""}
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
                  onChange={(event) =>
                    setCurrency(sanitizeCurrencyCode(event.target.value))
                  }
                  className={`${inputClassName} cursor-pointer`}
                >
                  {SUPPORTED_CURRENCIES.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name} ({option.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-text-muted">
                  Amounts convert to {currency} across the app. Example:{" "}
                  {format(123456)}
                </p>
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
            <div className="mt-5 flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Accent colour
              </span>
              <div
                role="group"
                aria-label="Accent colour"
                className="flex flex-wrap items-center gap-2"
              >
                {ACCENT_PALETTES.map((palette) => {
                  const selected = accentColor === palette.id;
                  return (
                    <motion.button
                      key={palette.id}
                      type="button"
                      onClick={() => setAccentColor(palette.id)}
                      aria-label={`Use ${palette.label} accent`}
                      aria-pressed={selected}
                      whileHover={reduced ? undefined : { scale: 1.1 }}
                      whileTap={reduced ? undefined : { scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 400, damping: 24 }}
                      style={{ backgroundColor: palette.light }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition-shadow ${
                        selected ? "ring-text" : "ring-transparent"
                      }`}
                    >
                      {selected && <Check className="h-4 w-4 text-white" />}
                    </motion.button>
                  );
                })}
              </div>
              <p className="text-xs text-text-muted">
                Applied to buttons, charts and highlights across the app. Save
                changes to keep it on your account.
              </p>
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

          <div className="flex flex-col items-end gap-2 pt-2">
            <AnimatePresence initial={false}>
              {feedback && (
                <motion.p
                  key={feedback.message}
                  role={feedback.tone === "error" ? "alert" : "status"}
                  initial={reduced ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-sm ${
                    feedback.tone === "error"
                      ? "text-danger"
                      : "text-text-secondary"
                  }`}
                >
                  {feedback.message}
                </motion.p>
              )}
            </AnimatePresence>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
