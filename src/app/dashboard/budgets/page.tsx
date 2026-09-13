import type { Metadata } from "next";
import { BudgetsView } from "@/components/dashboard/budgets-view";

export const metadata: Metadata = {
  title: "Budgets — Finance Tracker",
  description: "Set and track monthly budgets.",
};

export default function BudgetsPage() {
  return <BudgetsView />;
}