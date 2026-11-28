import type { Metadata } from "next";

export const SITE_NAME = "Finance Tracker";
export const LANDING_TITLE = "Finance Tracker — Track income, budget smarter";
export const LANDING_DESCRIPTION =
  "A modern personal finance tracker. Track income and expenses, set monthly budgets, and understand your spending with clear reports.";

const FALLBACK_SITE_URL = "http://localhost:3000";

export function resolveSiteUrl(value?: string): URL {
  if (!value) {
    return new URL(FALLBACK_SITE_URL);
  }

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url;
    }
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }

  return new URL(FALLBACK_SITE_URL);
}

export function landingMetadata(): Metadata {
  return {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    openGraph: {
      type: "website",
      url: "/",
      siteName: SITE_NAME,
      title: LANDING_TITLE,
      description: LANDING_DESCRIPTION,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: LANDING_TITLE,
      description: LANDING_DESCRIPTION,
    },
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
  };
}
