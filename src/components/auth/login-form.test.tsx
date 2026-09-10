import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

const { mockSignInWithPassword } = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  signInWithPassword: mockSignInWithPassword,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    mockSignInWithPassword.mockReset();
  });

  it("renders email and password fields with a submit button", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("validates required fields before calling signInWithPassword", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("shows a validation error for a malformed email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("calls signInWithPassword with trimmed credentials for valid input", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { user: { id: "user-1" } } },
      error: null,
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "  ada@example.com  ");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Logged in")).toBeInTheDocument();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "secret123",
    });
  });

  it("does not enforce a minimum password length when logging in", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { user: { id: "user-1" } } },
      error: null,
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "abc");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Logged in")).toBeInTheDocument();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "abc",
    });
  });

  it("shows the server error message when sign in fails", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();
    expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
  });

  it("links to the sign-up page", () => {
    render(<LoginForm />);

    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });
});