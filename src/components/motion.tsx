"use client";

import {
  motion,
  useInView,
  type Variant,
  type Variants,
} from "framer-motion";
import { type ReactNode, useRef } from "react";

/* ── Variant presets ── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 } satisfies Variant,
  visible: { opacity: 1, y: 0 } satisfies Variant,
};

const fadeIn: Variants = {
  hidden: { opacity: 0 } satisfies Variant,
  visible: { opacity: 1 } satisfies Variant,
};

/* ── Reusable wrappers ── */

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "fadeUp" | "fadeIn";
}

/** Animate children on scroll into view. Uses `once: true` so it only fires. */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "fadeUp",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const v = variant === "fadeIn" ? fadeIn : fadeUp;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={v}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

/** Container that staggers its direct children on scroll. */
export function Stagger({
  children,
  className,
  stagger = 0.1,
  delay = 0,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

/** Child element of a `<Stagger>` — fades up when the parent triggers. */
export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Fade-up entrance for hero elements (animates immediately, no scroll trigger). */
export function HeroReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
