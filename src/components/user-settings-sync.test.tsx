import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { UserSettingsSync } from "./user-settings-sync";

const { mockUseSession, mockSetCurrency, mockSetTheme } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockSetCurrency: vi.fn(),
  mockSetTheme: vi.fn(),
}));

vi.mock("@/components/auth/session-provider", () => ({
  useSession: () => mockUseSession(),
}));

vi.mock("@/components/currency-provider", () => ({
  useCurrency: () => ({ setCurrency: mockSetCurrency }),
}));

vi.mock("@/components/dark-mode-toggle", () => ({
  DarkModeToggle: () => null,
  setTheme: mockSetTheme,
}));

beforeEach(() => {
  mockUseSession.mockReset();
  mockSetCurrency.mockReset();
  mockSetTheme.mockReset();
});

describe("UserSettingsSync", () => {
  it("applies the signed-in user's saved preferences", () => {
    mockUseSession.mockReturnValue({
      status: "signedIn",
      user: {
        id: "user-1",
        email: "ada@example.com",
        settings: { currency: "EUR", theme: "dark" },
      },
      signOut: vi.fn(),
    });

    render(<UserSettingsSync />);

    expect(mockSetCurrency).toHaveBeenCalledWith("EUR");
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("does nothing before the user's settings are available", () => {
    mockUseSession.mockReturnValue({
      status: "loading",
      user: null,
      signOut: vi.fn(),
    });

    render(<UserSettingsSync />);

    expect(mockSetCurrency).not.toHaveBeenCalled();
    expect(mockSetTheme).not.toHaveBeenCalled();
  });

  it("applies the same settings only once", () => {
    mockUseSession.mockReturnValue({
      status: "signedIn",
      user: {
        id: "user-1",
        settings: { currency: "GBP", theme: "light" },
      },
      signOut: vi.fn(),
    });

    const { rerender } = render(<UserSettingsSync />);
    rerender(<UserSettingsSync />);

    expect(mockSetCurrency).toHaveBeenCalledOnce();
    expect(mockSetTheme).toHaveBeenCalledOnce();
  });
});
