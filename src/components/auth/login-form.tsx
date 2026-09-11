"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { hasErrors, validateLogin } from "@/lib/auth/validate";
import { signInWithPassword } from "@/lib/supabase/client";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "success" };

const inputClassName =
  "w-full rounded-xl border border-border bg-surface-muted pl-11 pr-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";

const errorInputClassName = "border-danger focus:border-danger focus:ring-danger/20";

export function LoginForm() {
  const reduced = usePrefersReducedMotion();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [view, setView] = useState<"login" | "reset">("login");

  function validateField(name: "email" | "password") {
    const errors = validateLogin({ email, password });
    setFieldErrors((prev) => ({ ...prev, [name]: errors[name] }));
  }

  function handleBlur(name: "email" | "password") {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errors = validateLogin({ email, password });
    setFieldErrors((prev) => ({ ...prev, [name]: errors[name] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ email: true, password: true });

    const errors = validateLogin({ email, password });
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      setStatus({ type: "idle" });
      return;
    }

    setStatus({ type: "loading" });
    const { error } = await signInWithPassword({ email: email.trim(), password });

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setStatus({ type: "success" });
    router.push("/app");
  }

  if (reduced) {
    if (view === "reset") {
      return (
        <div data-reduced-motion="true" className="w-full flex justify-center px-6 py-16">
          <PasswordResetForm onBack={() => setView("login")} />
        </div>
      );
    }

    return (
      <div data-reduced-motion="true" className="w-full flex justify-center px-6 py-16">
        {loginCard()}
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center px-6 py-16">
      <AnimatePresence mode="wait">
        {view === "reset" ? (
          <PasswordResetForm key="reset" onBack={() => setView("login")} />
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {loginCard()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  function loginCard() {
    return (
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <LogIn className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Log in to pick up where you left off.
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
              <p className="font-semibold text-text">Logged in</p>
              <p className="mt-1 text-sm text-text-secondary">
                You are all set — welcome back.
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
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (touched.email) {
                        validateField("email");
                      }
                    }}
                    onBlur={() => handleBlur("email")}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(touched.email && fieldErrors.email)}
                    aria-describedby={
                      touched.email && fieldErrors.email ? "email-error" : undefined
                    }
                    className={`${inputClassName} ${
                      touched.email && fieldErrors.email ? errorInputClassName : ""
                    }`}
                  />
                </div>
                {touched.email && fieldErrors.email && (
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (touched.password) {
                        validateField("password");
                      }
                    }}
                    onBlur={() => handleBlur("password")}
                    placeholder="Your password"
                    aria-invalid={Boolean(touched.password && fieldErrors.password)}
                    aria-describedby={
                      touched.password && fieldErrors.password
                        ? "password-error"
                        : undefined
                    }
                    className={`${inputClassName} ${
                      touched.password && fieldErrors.password ? errorInputClassName : ""
                    }`}
                  />
                </div>
                {touched.password && fieldErrors.password && (
                  <p
                    id="password-error"
                    role="alert"
                    className="text-xs font-medium text-danger"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setView("reset")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary transition-colors hover:text-primary"
                >
                  <KeyRound className="h-3 w-3" />
                  Forgot password?
                </button>
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
                    Logging in…
                  </>
                ) : (
                  <>
                    Log in
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>

              <p className="text-center text-sm text-text-secondary">
                New here?{" "}
                <Link
                  href="/sign-up"
                  className="font-medium text-primary transition-opacity hover:opacity-80"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    );
  }
}
