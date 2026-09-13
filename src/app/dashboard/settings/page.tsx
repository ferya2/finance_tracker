import type { Metadata } from "next";
import { SettingsView } from "@/components/dashboard/settings-view";

export const metadata: Metadata = {
  title: "Settings — Finance Tracker",
  description: "Manage your account and app preferences.",
};

export default function SettingsPage() {
  return <SettingsView />;
}