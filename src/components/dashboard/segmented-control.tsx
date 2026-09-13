"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  name: string;
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/** Pill-style segmented control with a sliding active state. */
export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const reduced = usePrefersReducedMotion();

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active ? "text-primary" : "text-text-secondary hover:text-text"
            }`}
          >
            {active && !reduced && (
              <motion.span
                layoutId={`${name}-active-pill`}
                className="absolute inset-0 rounded-full bg-primary-light"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {active && reduced && (
              <span className="absolute inset-0 rounded-full bg-primary-light" />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}