import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in — Finance Tracker",
  description:
    "Log in to Finance Tracker to track income and expenses, set monthly budgets, and understand your spending.",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <LoginForm />
    </main>
  );
}