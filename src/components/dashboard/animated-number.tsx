"use client";

import { animate } from "framer-motion";
import { useEffect, useState } from "react";
import { useCurrency } from "@/components/currency-provider";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

interface AnimatedNumberProps {
  value: number;
  /** Rounds the live value and renders it in the chosen currency by default. */
  format?: (value: number) => string;
  className?: string;
}

/** Counts up to `value` on mount; renders the final value when reduced motion. */
export function AnimatedNumber({
  value,
  format,
  className,
}: AnimatedNumberProps) {
  const reduced = usePrefersReducedMotion();
  const { format: formatMoney } = useCurrency();
  const [display, setDisplay] = useState(0);
  const formatter =
    format ?? ((next: number) => formatMoney(Math.round(next)));

  useEffect(() => {
    if (reduced) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [value, reduced]);

  return <span className={className}>{formatter(reduced ? value : display)}</span>;
}