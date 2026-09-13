import type { Metadata } from "next";
import { Tags } from "lucide-react";
import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = {
  title: "Categories — Finance Tracker",
  description: "Organize your spending into categories.",
};

export default function CategoriesPage() {
  return (
    <PagePlaceholder
      title="Categories"
      description="Group your spending your way with colors and icons — coming soon."
      icon={<Tags className="h-5 w-5" />}
    />
  );
}