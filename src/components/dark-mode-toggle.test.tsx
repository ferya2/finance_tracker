import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DarkModeToggle,
  getAccentColor,
  getTheme,
  setAccentColor,
  setTheme,
} from "./dark-mode-toggle";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

beforeEach(() => {
  stubMatchMedia(false);
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
  setTheme("light");
  setAccentColor("emerald");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("theme helpers", () => {
  it("applies and reports the chosen theme", () => {
    setTheme("dark");

    expect(getTheme()).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");

    setTheme("light");
    expect(getTheme()).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });
});

describe("accent helpers", () => {
  it("applies and stores the chosen accent", () => {
    setAccentColor("violet");

    expect(getAccentColor()).toBe("violet");
    expect(window.localStorage.getItem("accent-color")).toBe("violet");
    expect(
      document.documentElement.style.getPropertyValue("--accent-light"),
    ).toBe("#7c3aed");
    expect(
      document.documentElement.style.getPropertyValue("--accent-dark"),
    ).toBe("#a78bfa");

    setAccentColor("emerald");
    expect(getAccentColor()).toBe("emerald");
    expect(
      document.documentElement.style.getPropertyValue("--accent-light"),
    ).toBe("#059669");
  });
});

describe("DarkModeToggle", () => {
  it("switches the stored theme when clicked", async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(getTheme()).toBe("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });
});
