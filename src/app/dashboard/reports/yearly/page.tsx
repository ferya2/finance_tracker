import type { Metadata } from "next";
import { YearlyReportView } from "@/components/dashboard/yearly-report-view";

export const metadata: Metadata = {
  title: "Yearly overview — Finance Tracker",
  description: "A 12-month summary of your income, spending and categories.",
};

export default function YearlyReportPage() {
  return <YearlyReportView />;
}
