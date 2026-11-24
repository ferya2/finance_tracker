import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { PwaRegistrar } from "./pwa-registrar";

const { mockRegister } = vi.hoisted(() => ({
  mockRegister: vi.fn(),
}));

describe("PwaRegistrar", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockRegister.mockResolvedValue(undefined);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("navigator", {
      serviceWorker: { register: mockRegister },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("registers the root-scoped service worker in production", () => {
    render(<PwaRegistrar />);

    expect(mockRegister).toHaveBeenCalledWith("/sw");
  });

  it("does not register during development", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<PwaRegistrar />);

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("does nothing when service workers are unavailable", () => {
    vi.stubGlobal("navigator", {});
    render(<PwaRegistrar />);

    expect(mockRegister).not.toHaveBeenCalled();
  });
});
