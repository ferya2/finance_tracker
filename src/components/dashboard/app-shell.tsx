"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Settings,
  Sparkles,
  Tags,
  User,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useSession } from "@/components/auth/session-provider";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { UserChip } from "@/components/dashboard/user-chip";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { label: "Categories", href: "/dashboard/categories", icon: Tags },
  { label: "Budgets", href: "/dashboard/budgets", icon: PiggyBank },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Insights", href: "/dashboard/insights", icon: Sparkles },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const accountItem: NavItem = {
  label: "Account",
  href: "/dashboard/account",
  icon: User,
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary-light text-primary"
          : "text-text-secondary hover:bg-surface-subtle hover:text-text"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function Branding() {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-text">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
        <Wallet className="h-4 w-4" />
      </span>
      Finance Tracker
    </p>
  );
}

function SidebarFooter() {
  const { signOut } = useSession();
  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-border p-3">
      <NavLink item={accountItem} />
      <button
        type="button"
        onClick={() => void signOut()}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-danger-subtle hover:text-danger"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Log out
      </button>
    </div>
  );
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const reduced = usePrefersReducedMotion();
  const { signOut } = useSession();
  const transition = {
    duration: reduced ? 0 : 0.25,
    ease: [0.25, 0.1, 0.25, 1] as const,
  };

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface lg:hidden"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={transition}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Branding />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav aria-label="Sidebar" className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={onClose} />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-border p-3">
          <NavLink item={accountItem} onClick={onClose} />
          <button
            type="button"
            onClick={() => void signOut().then(onClose)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-danger-subtle hover:text-danger"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </motion.aside>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Branding />
        </div>
        <nav aria-label="Sidebar" className="mt-3 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="lg:hidden">
              <Branding />
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <UserChip />
            <DarkModeToggle />
          </div>
        </header>

        <AnimatePresence>
          {mobileOpen && <MobileDrawer onClose={() => setMobileOpen(false)} />}
        </AnimatePresence>

        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}