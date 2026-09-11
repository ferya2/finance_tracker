"use client";

import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { type ReactNode } from "react";
import { useSession } from "@/components/auth/session-provider";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
];

const authLinks = [
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
  const { status, signOut } = useSession();
  const signedIn = status === "signedIn";

  const renderLink = (
    link: { label: string; href: string },
    index: number,
  ): ReactNode => {
    if (reduced) {
      return (
        <a key={link.href} href={link.href} className={linkClassName}>
          {link.label}
          <Underline />
        </a>
      );
    }
    return (
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
    );
  };

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
      {links.map(renderLink)}
      {signedIn ? (
        <>
          <a href="/app/account" className={linkClassName}>
            Account
            <Underline />
          </a>
          <button
            type="button"
            onClick={() => void signOut()}
            className="group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </>
      ) : (
        authLinks.map(renderLink)
      )}
    </nav>
  );
}