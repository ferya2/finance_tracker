import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Wallet } from "lucide-react";
import { Button } from "./button";

describe("Button", () => {
  it("renders a link with the given href and label", () => {
    render(<Button href="#features">See features</Button>);
    const link = screen.getByRole("link", { name: "See features" });
    expect(link).toHaveAttribute("href", "#features");
  });

  it("renders a leading icon when provided", () => {
    const { container } = render(
      <Button href="#features" icon={Wallet}>
        See features
      </Button>,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders a trailing arrow when enabled", () => {
    const { container } = render(
      <Button href="#how-it-works" arrow>
        Start tracking
      </Button>,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });
});