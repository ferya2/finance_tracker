import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";

export const metadata: Metadata = {
  title: "Dashboard — Finance Tracker",
  description: "Your personal finance dashboard.",
};

export default function DashboardPage() {
  return <Dashboard />;
}