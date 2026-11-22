import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CurrencyProvider } from "@/components/currency-provider";
import { setTheme } from "@/components/dark-mode-toggle";
import { SettingsView } from "./settings-view";

const { mockUseSession, mockUpdateUserSettings } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockUpdateUserSettings: vi.fn(),
}));

vi.mock("@/components/auth/session-provider", () => ({
  useSession: () => mockUseSession(),
}));

vi.mock("@/lib/supabase/client", () => ({
  updateUserSettings: mockUpdateUserSettings,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

function renderSettings() {
  return render(
    <CurrencyProvider userId="user-1">
      <SettingsView />
    </CurrencyProvider>,
  );
}

beforeEach(() => {
  stubMatchMedia(true);
  window.localStorage.clear();
  setTheme("light");
  mockUseSession.mockReset();
  mockUseSession.mockReturnValue({
    status: "signedIn",
    user: {
      id: "user-1",
      email: "ada@example.com",
      settings: {
        displayName: "Ada Lovelace",
        currency: "USD",
        theme: "light",
      },
    },
    signOut: vi.fn(),
  });
  mockUpdateUserSettings.mockReset();
  mockUpdateUserSettings.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SettingsView", () => {
  it("renders the signed-in profile and current preferences", () => {
    renderSettings();

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Your data")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ada@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("US Dollar (USD)")).toBeInTheDocument();
  });

  it("persists the profile, currency and theme", async () => {
    const user = userEvent.setup();
    renderSettings();

    const name = screen.getByDisplayValue("Ada Lovelace");
    await user.clear(name);
    await user.type(name, "Grace");
    await user.selectOptions(screen.getByRole("combobox"), "EUR");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mockUpdateUserSettings).toHaveBeenCalledWith({
      displayName: "Grace",
      currency: "EUR",
      theme: "light",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Settings saved.",
    );
  });

  it("shows an error returned by the save request", async () => {
    const user = userEvent.setup();
    mockUpdateUserSettings.mockResolvedValue({
      error: new Error("Could not update profile."),
    });
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not update profile.",
    );
  });

  it("requires a display name before saving", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.clear(screen.getByDisplayValue("Ada Lovelace"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a display name.",
    );
    expect(mockUpdateUserSettings).not.toHaveBeenCalled();
  });

  it("toggles the notification switches", async () => {
    const user = userEvent.setup();
    renderSettings();

    const switchEl = screen.getByRole("switch", { name: "Budget alerts" });
    expect(switchEl).toHaveAttribute("aria-checked", "true");

    await user.click(switchEl);
    expect(switchEl).toHaveAttribute("aria-checked", "false");
  });
});
