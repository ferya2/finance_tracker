import type { Metadata } from "next";
import { PiggyBank } from "lucide-react";
import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = {
  title: "Budgets — Finance Tracker",
  description: "Set and track monthly budgets.",
};

export default function BudgetsPage() {
  return (
    <PagePlaceholder
      title="Budgets"
      description="Set a budget per category and follow your progress month after month — coming soon."
      icon={<PiggyBank className="h-5 w-5" />}
    />
  );
}