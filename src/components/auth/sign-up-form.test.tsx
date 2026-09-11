import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "./sign-up-form";

const { mockSignUp, mockPush } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/supabase/client", () => ({
  signUp: mockSignUp,
}));

describe("SignUpForm", () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockPush.mockReset();
  });

  it("renders email and password fields with a submit button", () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  it("validates required fields before calling signUp", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows a validation error for a malformed email", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signUp with the trimmed email and password for valid input", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { user: { id: "user-1" } } },
      error: null,
    });
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "  ada@example.com  ");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Account created")).toBeInTheDocument();
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "secret123",
    });
  });

  it("asks the user to confirm their email when no session is returned", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: null },
      error: null,
    });
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText(/check your email for a confirmation link/i),
    ).toBeInTheDocument();
  });

  it("shows the server error message when signUp fails", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("User already registered")).toBeInTheDocument();
    expect(mockSignUp).toHaveBeenCalledTimes(1);
  });

  it("redirects to /app after signup when a session is returned", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { user: { id: "user-1" } } },
      error: null,
    });
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await screen.findByText("Account created");
    expect(mockPush).toHaveBeenCalledWith("/app");
  });

  it("does not redirect when email confirmation is required", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: null },
      error: null,
    });
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await screen.findByText(/check your email for a confirmation link/i);
    expect(mockPush).not.toHaveBeenCalled();
  });
});