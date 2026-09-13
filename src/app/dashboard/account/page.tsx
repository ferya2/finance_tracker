import type { Metadata } from "next";
import { AccountView } from "@/components/dashboard/account-view";

export const metadata: Metadata = {
  title: "Account — Finance Tracker",
  description: "Your Finance Tracker account details.",
};

export default function AccountPage() {
  return <AccountView />;
}