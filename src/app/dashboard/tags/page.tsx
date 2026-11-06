import type { Metadata } from "next";
import { TagsView } from "@/components/dashboard/tags-view";

export const metadata: Metadata = {
  title: "Tags — Finance Tracker",
  description: "Label and group your transactions with tags.",
};

export default function TagsPage() {
  return <TagsView />;
}
