"use client";

import { animate } from "framer-motion";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { formatCurrency } from "@/lib/finance/format";

interface AnimatedNumberProps {
  value: number;
  /** Rounds the live value and renders it as a currency string by default. */
  format?: (value: number) => string;
  className?: string;
}

/** Counts up to `value` on mount; renders the final value when reduced motion. */
export function AnimatedNumber({
  value,
  format = (next) => formatCurrency(Math.round(next)),
  className,
}: AnimatedNumberProps) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [value, reduced]);

  return <span className={className}>{format(reduced ? value : display)}</span>;
}