import { buildServiceWorkerScript } from "@/lib/pwa/service-worker";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildServiceWorkerScript(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
