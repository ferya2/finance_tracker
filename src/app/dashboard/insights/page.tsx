import type { Metadata } from "next";
import { InsightsView } from "@/components/dashboard/insights-view";

export const metadata: Metadata = {
  title: "Insights — Finance Tracker",
  description: "Smart insights and trends from your spending.",
};

export default function InsightsPage() {
  return <InsightsView />;
}