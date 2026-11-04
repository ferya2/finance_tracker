import type { Metadata } from "next";
import { AccountsView } from "@/components/dashboard/accounts-view";

export const metadata: Metadata = {
  title: "Accounts — Finance Tracker",
  description: "Manage your wallets and transfer money between accounts.",
};

export default function AccountsPage() {
  return <AccountsView />;
}
