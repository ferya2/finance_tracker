import type { Metadata } from "next";
import { DateRangeReportView } from "@/components/dashboard/date-range-report-view";

export const metadata: Metadata = {
  title: "Date-range report — Finance Tracker",
  description: "A custom-range report of your income, spending and categories.",
};

export default function DateRangeReportPage() {
  return <DateRangeReportView />;
}
