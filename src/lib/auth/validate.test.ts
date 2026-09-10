import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  hasErrors,
  validateLogin,
  validateSignUp,
} from "./validate";

describe("validateSignUp", () => {
  it("returns no errors for a valid email and password", () => {
    expect(
      validateSignUp({ email: "ada@example.com", password: "secret123" }),
    ).toEqual({});
  });

  it("validates an email with surrounding whitespace", () => {
    expect(
      validateSignUp({ email: "  ada@example.com  ", password: "secret123" }),
    ).toEqual({});
  });

  it("requires an email", () => {
    expect(validateSignUp({ email: "", password: "secret123" }).email).toBe(
      "Email is required.",
    );
  });

  it("rejects a malformed email", () => {
    expect(
      validateSignUp({ email: "not-an-email", password: "secret123" }).email,
    ).toBe("Enter a valid email address.");
  });

  it("requires a password", () => {
    expect(validateSignUp({ email: "ada@example.com", password: "" }).password).toBe(
      "Password is required.",
    );
  });

  it("enforces the minimum password length", () => {
    const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(
      validateSignUp({ email: "ada@example.com", password: short }).password,
    ).toBe(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  });

  it("accepts a password of exactly the minimum length", () => {
    const exact = "a".repeat(MIN_PASSWORD_LENGTH);
    expect(
      validateSignUp({ email: "ada@example.com", password: exact }),
    ).toEqual({});
  });

  it("collects multiple field errors at once", () => {
    expect(validateSignUp({ email: "", password: "" })).toEqual({
      email: "Email is required.",
      password: "Password is required.",
    });
  });
});

describe("validateLogin", () => {
  it("returns no errors for a valid email and password", () => {
    expect(
      validateLogin({ email: "ada@example.com", password: "secret123" }),
    ).toEqual({});
  });

  it("validates an email with surrounding whitespace", () => {
    expect(
      validateLogin({ email: "  ada@example.com  ", password: "secret123" }),
    ).toEqual({});
  });

  it("requires an email", () => {
    expect(validateLogin({ email: "", password: "secret123" }).email).toBe(
      "Email is required.",
    );
  });

  it("rejects a malformed email", () => {
    expect(
      validateLogin({ email: "not-an-email", password: "secret123" }).email,
    ).toBe("Enter a valid email address.");
  });

  it("requires a password", () => {
    expect(validateLogin({ email: "ada@example.com", password: "" }).password).toBe(
      "Password is required.",
    );
  });

  it("does not enforce a minimum password length for existing accounts", () => {
    expect(
      validateLogin({ email: "ada@example.com", password: "abc" }),
    ).toEqual({});
  });

  it("collects multiple field errors at once", () => {
    expect(validateLogin({ email: "", password: "" })).toEqual({
      email: "Email is required.",
      password: "Password is required.",
    });
  });
});

describe("hasErrors", () => {
  it("is false when there are no errors", () => {
    expect(hasErrors({})).toBe(false);
  });

  it("is true when any field has an error", () => {
    expect(hasErrors({ email: "Email is required." })).toBe(true);
  });
});