import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/dashboard/app-shell";

export const metadata: Metadata = {
  title: "Dashboard — Finance Tracker",
  description: "Your personal finance dashboard, reports and budgets.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}