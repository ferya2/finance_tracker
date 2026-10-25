import type { Metadata } from "next";
import { MonthlyReportView } from "@/components/dashboard/monthly-report-view";

export const metadata: Metadata = {
  title: "Monthly report — Finance Tracker",
  description: "A composed report of one month's income, spending and budgets.",
};

export default function MonthlyReportPage() {
  return <MonthlyReportView />;
}
