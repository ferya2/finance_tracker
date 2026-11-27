"use client";

import { Home, RotateCcw } from "lucide-react";
import { ErrorFallback } from "@/components/error-fallback";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      code="500"
      title="Something went wrong"
      description="We couldn't load this page. Try again — your data is safe."
      primary={{ label: "Try again", onClick: reset, icon: RotateCcw }}
      secondary={{ label: "Back to home", href: "/", icon: Home }}
    />
  );
}
