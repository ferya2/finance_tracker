"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { hasErrors, validateResetPassword } from "@/lib/auth/validate";
import { resetPassword } from "@/lib/supabase/client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "success" };

const inputClassName =
  "w-full rounded-xl border border-border bg-surface-muted pl-11 pr-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";

const errorInputClassName = "border-danger focus:border-danger focus:ring-danger/20";

interface PasswordResetFormProps {
  onBack: () => void;
}

export function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const reduced = usePrefersReducedMotion();
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  function validateField(value: string) {
    const errors = validateResetPassword({ email: value });
    setFieldErrors(errors);
  }

  function handleBlur() {
    setTouched(true);
    validateField(email);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);

    const errors = validateResetPassword({ email });
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      setStatus({ type: "idle" });
      return;
    }

    setStatus({ type: "loading" });
    const { error } = await resetPassword(email.trim());

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setStatus({ type: "success" });
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <Send className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
              Reset your password
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Enter the email you signed up with and we&apos;ll send you a reset
              link.
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
              <p className="font-semibold text-text">Check your inbox</p>
              <p className="mt-1 text-sm text-text-secondary">
                We sent a password reset link to{" "}
                <span className="font-medium text-text">{email.trim()}</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to log in
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-email" className="text-sm font-medium text-text">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (touched) {
                        validateField(event.target.value);
                      }
                    }}
                    onBlur={handleBlur}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(touched && fieldErrors.email)}
                    aria-describedby={
                      touched && fieldErrors.email ? "reset-email-error" : undefined
                    }
                    className={`${inputClassName} ${
                      touched && fieldErrors.email ? errorInputClassName : ""
                    }`}
                  />
                </div>
                {touched && fieldErrors.email && (
                  <p
                    id="reset-email-error"
                    role="alert"
                    className="text-xs font-medium text-danger"
                  >
                    {fieldErrors.email}
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
                    Sending link…
                  </>
                ) : (
                  <>
                    Send reset link
                    <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-text-secondary transition-opacity hover:opacity-80"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to log in
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
