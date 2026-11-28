import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/auth/session-provider";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { RootHeader } from "@/components/root-header";
import {
  LANDING_DESCRIPTION,
  LANDING_TITLE,
  resolveSiteUrl,
} from "@/lib/seo/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  title: LANDING_TITLE,
  description: LANDING_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Finance Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <RootHeader />
          {children}
          <PwaRegistrar />
        </SessionProvider>
      </body>
    </html>
  );
}
