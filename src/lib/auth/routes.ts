export type RouteAction =
  | { type: "redirect"; destination: string }
  | { type: "next" };

const PROTECTED_PREFIXES = ["/app"];
const AUTH_PAGES = ["/login", "/sign-up"];

export function getRouteAction(
  pathname: string,
  isAuthenticated: boolean,
): RouteAction {
  if (isAuthenticated) {
    if (AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return { type: "redirect", destination: "/app" };
    }
    return { type: "next" };
  }

  if (
    PROTECTED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    )
  ) {
    return { type: "redirect", destination: "/login" };
  }

  return { type: "next" };
}
