import type { NewCategory } from "@/types/category";

/**
 * Starter categories seeded for a brand-new user so the app is usable right
 * away. Mirrors the dummy categories used across the dashboard UI.
 */
export const DEFAULT_CATEGORIES: NewCategory[] = [
  { name: "Salary", color: "#059669", kind: "income" },
  { name: "Freelance", color: "#0d9488", kind: "income" },
  { name: "Housing", color: "#d97706", kind: "expense" },
  { name: "Food & dining", color: "#e11d48", kind: "expense" },
  { name: "Transport", color: "#0284c7", kind: "expense" },
  { name: "Shopping", color: "#7c3aed", kind: "expense" },
  { name: "Utilities", color: "#059669", kind: "expense" },
  { name: "Entertainment", color: "#db2777", kind: "expense" },
];