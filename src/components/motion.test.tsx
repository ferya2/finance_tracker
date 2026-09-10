import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroReveal, Reveal } from "./motion";
import { Nav } from "./nav";
import { AmbientBackground } from "./landing/ambient-background";

/* jsdom has no IntersectionObserver; framer-motion's useInView needs one.
   The mock never fires, so scroll-triggered state stays hidden — fine. */
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reduced motion", () => {
  it("renders Reveal content statically (visible) when reduced motion is preferred", () => {
    stubMatchMedia(true);
    render(<Reveal>Reveal me</Reveal>);
    const el = screen.getByText("Reveal me");
    expect(el).toBeInTheDocument();
    expect(el.closest("[data-reduced-motion]")).not.toBeNull();
  });

  it("renders HeroReveal content statically when reduced motion is preferred", () => {
    stubMatchMedia(true);
    render(<HeroReveal>Hero me</HeroReveal>);
    const el = screen.getByText("Hero me");
    expect(el).toBeInTheDocument();
    expect(el.closest("[data-reduced-motion]")).not.toBeNull();
  });

  it("keeps nav links clickable with no entrance animation when reduced", () => {
    stubMatchMedia(true);
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute(
      "href",
      "#features",
    );
    expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute(
      "href",
      "#how-it-works",
    );
  });

  it("skips the 3D background when reduced motion is preferred", () => {
    stubMatchMedia(true);
    const { container } = render(<AmbientBackground />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});