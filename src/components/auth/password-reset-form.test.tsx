import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordResetForm } from "./password-reset-form";

const { mockResetPassword } = vi.hoisted(() => ({
  mockResetPassword: vi.fn(),
}));

const mockOnBack = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  resetPassword: mockResetPassword,
}));

describe("PasswordResetForm", () => {
  beforeEach(() => {
    mockResetPassword.mockReset();
    mockOnBack.mockReset();
  });

  it("renders an email field and a submit button", () => {
    render(<PasswordResetForm onBack={mockOnBack} />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeInTheDocument();
  });

  it("shows an inline email error on blur when the field is empty", async () => {
    const user = userEvent.setup();
    render(<PasswordResetForm onBack={mockOnBack} />);

    await user.click(screen.getByLabelText("Email"));
    await user.tab();

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("shows an inline email error on blur for a malformed email", async () => {
    const user = userEvent.setup();
    render(<PasswordResetForm onBack={mockOnBack} />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.tab();

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("validates on submit even if the field was not touched", async () => {
    const user = userEvent.setup();
    render(<PasswordResetForm onBack={mockOnBack} />);

    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("calls resetPassword with the trimmed email for valid input", async () => {
    mockResetPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<PasswordResetForm onBack={mockOnBack} />);

    await user.type(screen.getByLabelText("Email"), "  ada@example.com  ");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(
      await screen.findByText(/check your inbox/i),
    ).toBeInTheDocument();
    expect(mockResetPassword).toHaveBeenCalledWith("ada@example.com");
  });

  it("shows the server error message when resetPassword fails", async () => {
    mockResetPassword.mockResolvedValue({
      error: { message: "Unable to send reset email" },
    });
    const user = userEvent.setup();
    render(<PasswordResetForm onBack={mockOnBack} />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(
      await screen.findByText("Unable to send reset email"),
    ).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup();
    render(<PasswordResetForm onBack={mockOnBack} />);

    await user.click(screen.getByRole("button", { name: "Back to log in" }));

    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  it("calls onBack from the success state", async () => {
    mockResetPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<PasswordResetForm onBack={mockOnBack} />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await screen.findByText(/check your inbox/i);
    await user.click(screen.getByRole("button", { name: "Back to log in" }));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("clears the inline error when a valid email is typed after blur", async () => {
    const user = userEvent.setup();
    render(<PasswordResetForm onBack={mockOnBack} />);

    await user.click(screen.getByLabelText("Email"));
    await user.tab();
    expect(await screen.findByText("Email is required.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "ada@example.com");

    expect(screen.queryByText("Email is required.")).not.toBeInTheDocument();
  });
});
