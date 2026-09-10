"use client";

import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  arrow?: boolean;
  className?: string;
}

const baseClassName =
  "group inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-medium transition-colors";

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
  secondary:
    "border border-border bg-surface text-text-secondary hover:bg-surface-subtle hover:text-text",
};

export function Button({
  children,
  href,
  variant = "primary",
  icon,
  arrow = false,
  className = "",
}: ButtonProps) {
  const Icon = icon;
  return (
    <motion.a
      href={href}
      whileHover={{ y: -1, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`${baseClassName} ${variantClassName[variant]} ${className}`}
    >
      {Icon && (
        <Icon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
      )}
      {children}
      {arrow && (
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      )}
    </motion.a>
  );
}