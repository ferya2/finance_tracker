import type { Metadata } from "next";
import { SavingsGoalsView } from "@/components/dashboard/savings-goals-view";

export const metadata: Metadata = {
  title: "Savings goals — Finance Tracker",
  description: "Set savings targets and track your progress over time.",
};

export default function SavingsGoalsPage() {
  return <SavingsGoalsView />;
}
