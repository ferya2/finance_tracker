"use client";

import { motion } from "framer-motion";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
];

export function Nav() {
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
      {links.map((link, index) => (
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
          className="group relative rounded-full px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >
          {link.label}
          <span className="absolute inset-x-4 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-primary to-accent transition-transform duration-300 group-hover:scale-x-100" />
        </motion.a>
      ))}
    </nav>
  );
}