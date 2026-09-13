import type { Metadata } from "next";
import { CategoriesView } from "@/components/dashboard/categories-view";

export const metadata: Metadata = {
  title: "Categories — Finance Tracker",
  description: "Organize your spending into categories.",
};

export default function CategoriesPage() {
  return <CategoriesView />;
}