import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CurrencyProvider, useCurrency } from "./currency-provider";
import {
  CURRENCY_STORAGE_PREFIX,
  currencyStorageKey,
} from "@/lib/storage/currency-settings";

function Consumer() {
  const { currency, setCurrency, format } = useCurrency();
  return (
    <div>
      <p data-testid="currency">{currency}</p>
      <p data-testid="formatted">{format(10000)}</p>
      <button type="button" onClick={() => setCurrency("EUR")}>
        Euros
      </button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("CurrencyProvider", () => {
  it("defaults to the base currency", () => {
    render(
      <CurrencyProvider userId="user-1">
        <Consumer />
      </CurrencyProvider>,
    );

    expect(screen.getByTestId("currency")).toHaveTextContent("USD");
    expect(screen.getByTestId("formatted")).toHaveTextContent("$100.00");
  });

  it("converts and formats amounts in the chosen currency", async () => {
    const user = userEvent.setup();
    render(
      <CurrencyProvider userId="user-1">
        <Consumer />
      </CurrencyProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Euros" }));

    expect(screen.getByTestId("currency")).toHaveTextContent("EUR");
    expect(screen.getByTestId("formatted")).toHaveTextContent("€92.00");
  });

  it("persists the choice under the user's key", async () => {
    const user = userEvent.setup();
    render(
      <CurrencyProvider userId="user-1">
        <Consumer />
      </CurrencyProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Euros" }));

    expect(
      window.localStorage.getItem(currencyStorageKey("user-1")),
    ).toBe("EUR");
  });

  it("restores a saved currency", () => {
    window.localStorage.setItem(
      `${CURRENCY_STORAGE_PREFIX}:user-1`,
      "GBP",
    );

    render(
      <CurrencyProvider userId="user-1">
        <Consumer />
      </CurrencyProvider>,
    );

    expect(screen.getByTestId("currency")).toHaveTextContent("GBP");
    expect(screen.getByTestId("formatted")).toHaveTextContent("£79.00");
  });

  it("falls back to the default outside a provider", () => {
    render(<Consumer />);

    expect(screen.getByTestId("currency")).toHaveTextContent("USD");
    expect(screen.getByTestId("formatted")).toHaveTextContent("$100.00");
  });
});
