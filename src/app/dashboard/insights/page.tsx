import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = {
  title: "Insights — Finance Tracker",
  description: "Smart insights and trends from your spending.",
};

export default function InsightsPage() {
  return (
    <PagePlaceholder
      title="Insights"
      description="Spot trends, top categories and smarter money habits — coming soon."
      icon={<Sparkles className="h-5 w-5" />}
    />
  );
}