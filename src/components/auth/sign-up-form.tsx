"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { hasErrors, validateSignUp } from "@/lib/auth/validate";
import { signUp } from "@/lib/supabase/client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "success"; needsConfirmation: boolean };

const inputClassName =
  "w-full rounded-xl border border-border bg-surface-muted pl-11 pr-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";

const errorInputClassName = "border-danger focus:border-danger focus:ring-danger/20";

export function SignUpForm() {
  const reduced = usePrefersReducedMotion();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateSignUp({ email, password });
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      setStatus({ type: "idle" });
      return;
    }

    setStatus({ type: "loading" });
    const { data, error } = await signUp({ email: email.trim(), password });

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    const hasSession = Boolean(data.session);
    setStatus({ type: "success", needsConfirmation: !hasSession });
    if (hasSession) {
      router.push("/app");
    }
  }

  const card = (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Wallet className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Start tracking income and expenses in minutes.
          </p>
        </div>
      </div>

      {status.type === "success" ? (
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 rounded-xl bg-success-subtle p-6 text-center"
          role="status"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light text-success">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-text">Account created</p>
            <p className="mt-1 text-sm text-text-secondary">
              {status.needsConfirmation
                ? "Check your email for a confirmation link to activate your account."
                : "You're all set — welcome aboard."}
            </p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-text">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={`${inputClassName} ${
                    fieldErrors.email ? errorInputClassName : ""
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="text-xs font-medium text-danger"
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-text">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  className={`${inputClassName} ${
                    fieldErrors.password ? errorInputClassName : ""
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="text-xs font-medium text-danger"
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {status.type === "error" && (
              <motion.p
                initial={reduced ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-danger-subtle px-3 py-2.5 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {status.message}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={status.type === "loading"}
              whileHover={reduced ? undefined : { scale: 1.01 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-opacity disabled:opacity-70"
            >
              {status.type === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </>
              )}
            </motion.button>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary transition-opacity hover:opacity-80"
              >
                Log in
              </Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );

  if (reduced) {
    return (
      <div data-reduced-motion="true" className="w-full flex justify-center px-6 py-16">
        {card}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full flex justify-center px-6 py-16"
    >
      {card}
    </motion.div>
  );
}