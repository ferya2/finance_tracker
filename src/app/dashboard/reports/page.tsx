import type { Metadata } from "next";
import { ReportsView } from "@/components/dashboard/reports-view";

export const metadata: Metadata = {
  title: "Reports — Finance Tracker",
  description: "Charts and reports on your finances.",
};

export default function ReportsPage() {
  return <ReportsView />;
}