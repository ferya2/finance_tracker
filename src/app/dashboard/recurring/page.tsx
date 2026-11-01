import type { Metadata } from "next";
import { RecurringView } from "@/components/dashboard/recurring-view";

export const metadata: Metadata = {
  title: "Recurring — Finance Tracker",
  description: "Manage income and expenses that repeat on a schedule.",
};

export default function RecurringPage() {
  return <RecurringView />;
}
