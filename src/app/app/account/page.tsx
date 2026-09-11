import type { Metadata } from "next";
import { AccountProfile } from "@/components/auth/account-profile";

export const metadata: Metadata = {
  title: "Account — Finance Tracker",
  description: "Your Finance Tracker account details.",
};

export default function AccountPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <AccountProfile />
    </main>
  );
}