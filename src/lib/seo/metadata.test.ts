import { describe, expect, it } from "vitest";
import {
  LANDING_DESCRIPTION,
  LANDING_TITLE,
  SITE_NAME,
  landingMetadata,
  resolveSiteUrl,
} from "./metadata";

describe("resolveSiteUrl", () => {
  it("uses localhost when no URL is configured", () => {
    expect(resolveSiteUrl().toString()).toBe("http://localhost:3000/");
    expect(resolveSiteUrl("").toString()).toBe("http://localhost:3000/");
  });

  it("accepts an absolute http(s) URL", () => {
    expect(resolveSiteUrl("https://finance.example.com").toString()).toBe(
      "https://finance.example.com/",
    );
    expect(resolveSiteUrl("http://example.com/app").toString()).toBe(
      "http://example.com/app",
    );
  });

  it("falls back for invalid or non-http URLs", () => {
    expect(resolveSiteUrl("not-a-url").toString()).toBe(
      "http://localhost:3000/",
    );
    expect(resolveSiteUrl("ftp://example.com").toString()).toBe(
      "http://localhost:3000/",
    );
  });
});

describe("landingMetadata", () => {
  const metadata = landingMetadata();

  it("sets the landing title and description", () => {
    expect(metadata.title).toBe(LANDING_TITLE);
    expect(metadata.description).toBe(LANDING_DESCRIPTION);
  });

  it("sets Open Graph and Twitter card metadata", () => {
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: "/",
      siteName: SITE_NAME,
      title: LANDING_TITLE,
      description: LANDING_DESCRIPTION,
      locale: "en_US",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: LANDING_TITLE,
      description: LANDING_DESCRIPTION,
    });
  });

  it("sets a canonical URL and indexable robots rules", () => {
    expect(metadata.alternates).toMatchObject({ canonical: "/" });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });
});
