import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create your account — Finance Tracker",
  description:
    "Sign up for Finance Tracker to track income and expenses, set monthly budgets, and understand your spending.",
};

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <SignUpForm />
    </main>
  );
}