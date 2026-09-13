import type { Metadata } from "next";
import { TransactionsView } from "@/components/dashboard/transactions-view";

export const metadata: Metadata = {
  title: "Transactions — Finance Tracker",
  description: "Your income and expense transactions.",
};

export default function TransactionsPage() {
  return <TransactionsView />;
}