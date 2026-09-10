import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "./nav";

describe("Nav", () => {
  it("renders an anchor for each landing section and the sign-up page", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute(
      "href",
      "#features",
    );
    expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute(
      "href",
      "#how-it-works",
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });
});