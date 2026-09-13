import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";
import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = {
  title: "Transactions — Finance Tracker",
  description: "Your income and expense transactions.",
};

export default function TransactionsPage() {
  return (
    <PagePlaceholder
      title="Transactions"
      description="List, add, edit and search every income and expense — coming in the next weeks."
      icon={<ArrowLeftRight className="h-5 w-5" />}
    />
  );
}