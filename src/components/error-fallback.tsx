"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Compass, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

interface FallbackActionBase {
  label: string;
  icon?: LucideIcon;
}

type FallbackLinkAction = FallbackActionBase & {
  href: string;
  onClick?: never;
};

type FallbackButtonAction = FallbackActionBase & {
  onClick: () => void;
  href?: never;
};

interface ErrorFallbackProps {
  code: "404" | "500";
  title: string;
  description: string;
  primary: FallbackLinkAction | FallbackButtonAction;
  secondary?: FallbackLinkAction;
}

function FallbackActionButton({
  action,
  primary,
}: {
  action: FallbackLinkAction | FallbackButtonAction;
  primary: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const Icon = action.icon;
  const className = primary
    ? "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
    : "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text";
  const content = (
    <>
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={action.onClick}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={className}
    >
      {content}
    </motion.button>
  );
}

export function ErrorFallback({
  code,
  title,
  description,
  primary,
  secondary,
}: ErrorFallbackProps) {
  const reduced = usePrefersReducedMotion();
  const Icon = code === "404" ? Compass : AlertTriangle;

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary-light), transparent 65%)",
          }}
        />
        <div className="absolute inset-0 [background-image:radial-gradient(rgba(9,9,11,0.07)_1px,transparent_1px)] [background-size:28px_28px] dark:[background-image:radial-gradient(rgba(244,244,245,0.05)_1px,transparent_1px)]" />
      </div>
      <motion.section
        role={code === "500" ? "alert" : undefined}
        data-reduced-motion={reduced ? "true" : undefined}
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.4, ease: EASE }}
        className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center justify-center px-6 py-20 text-center"
      >
        <motion.span
          initial={reduced ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: reduced ? 0 : 0.35,
            ease: EASE,
            delay: reduced ? 0 : 0.05,
          }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface text-primary shadow-lg shadow-primary/10"
        >
          <Icon aria-hidden="true" className="h-7 w-7" />
        </motion.span>
        <p className="mt-8 font-mono text-xs font-semibold uppercase tracking-[0.35em] text-primary">
          Error {code}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary sm:text-base">
          {description}
        </p>
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <FallbackActionButton action={primary} primary />
          {secondary ? (
            <FallbackActionButton action={secondary} primary={false} />
          ) : null}
        </div>
      </motion.section>
    </div>
  );
}
