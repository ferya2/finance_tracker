import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Hero } from "./hero";

describe("Hero", () => {
  it("does not mount the 3D scene on small/unknown viewports", () => {
    const { container } = render(<Hero />);
    expect(container.querySelector("canvas")).toBeNull();
  });
});