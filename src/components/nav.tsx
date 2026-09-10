"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Log in", href: "/login" },
  { label: "Sign up", href: "/sign-up" },
];

const linkClassName =
  "group relative rounded-full px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text";

function Underline() {
  return (
    <span className="absolute inset-x-4 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-primary to-accent transition-transform duration-300 group-hover:scale-x-100" />
  );
}

export function Nav() {
  const reduced = usePrefersReducedMotion();

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
      {links.map((link, index) =>
        reduced ? (
          <a key={link.href} href={link.href} className={linkClassName}>
            {link.label}
            <Underline />
          </a>
        ) : (
          <motion.a
            key={link.href}
            href={link.href}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + index * 0.06,
              duration: 0.4,
              ease: "easeOut",
            }}
            className={linkClassName}
          >
            {link.label}
            <Underline />
          </motion.a>
        ),
      )}
    </nav>
  );
}