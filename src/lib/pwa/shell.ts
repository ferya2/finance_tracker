export const PWA_CACHE_NAME = "finance-tracker-shell-v1";
export const PWA_OFFLINE_PATH = "/offline.html";

export const PWA_SHELL_PATHS = [
  "/",
  "/login",
  "/sign-up",
  PWA_OFFLINE_PATH,
] as const;

export const PWA_ASSET_PATHS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
] as const;

export function isPwaShellPath(pathname: string): boolean {
  return (PWA_SHELL_PATHS as readonly string[]).includes(pathname);
}

export function isPwaPrecachePath(pathname: string): boolean {
  return (
    isPwaShellPath(pathname) ||
    (PWA_ASSET_PATHS as readonly string[]).includes(pathname)
  );
}

export function isPwaStaticAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/static/") ||
    (PWA_ASSET_PATHS as readonly string[]).includes(pathname)
  );
}
