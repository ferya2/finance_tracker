import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Finance Tracker",
  description: "Your personal finance dashboard.",
};

export default function DashboardPage() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <p className="text-sm text-text-secondary">Dashboard coming soon.</p>
    </main>
  );
}
