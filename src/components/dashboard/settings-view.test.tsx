import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsView } from "./settings-view";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SettingsView", () => {
  it("renders the settings sections with defaults", () => {
    render(<SettingsView />);

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Your data")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ada@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("US Dollar (USD)")).toBeInTheDocument();
  });

  it("edits the display name and chooses a currency", async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    const name = screen.getByDisplayValue("Ada Lovelace");
    await user.clear(name);
    await user.type(name, "Grace");

    expect(screen.getByDisplayValue("Grace")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "EUR");
    expect(screen.getByDisplayValue("Euro (EUR)")).toBeInTheDocument();
  });

  it("toggles the notification switches", async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    const switchEl = screen.getByRole("switch", { name: "Budget alerts" });
    expect(switchEl).toHaveAttribute("aria-checked", "true");

    await user.click(switchEl);
    expect(switchEl).toHaveAttribute("aria-checked", "false");
  });
});