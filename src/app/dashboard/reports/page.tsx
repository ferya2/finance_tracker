import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = {
  title: "Reports — Finance Tracker",
  description: "Charts and reports on your finances.",
};

export default function ReportsPage() {
  return (
    <PagePlaceholder
      title="Reports"
      description="Turn your history into clear charts and monthly reports — coming soon."
      icon={<BarChart3 className="h-5 w-5" />}
    />
  );
}