import { Home, LayoutDashboard } from "lucide-react";
import { ErrorFallback } from "@/components/error-fallback";

export default function NotFound() {
  return (
    <ErrorFallback
      code="404"
      title="This page got lost"
      description="The link may be outdated or the page may have moved. Head back home, or jump straight into your dashboard."
      primary={{ label: "Back to home", href: "/", icon: Home }}
      secondary={{
        label: "Go to dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      }}
    />
  );
}
