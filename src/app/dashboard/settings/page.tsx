import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = {
  title: "Settings — Finance Tracker",
  description: "Manage your account and app preferences.",
};

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Profile, currency, theme and more — coming soon."
      icon={<Settings className="h-5 w-5" />}
    />
  );
}