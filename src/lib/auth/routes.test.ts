import { describe, expect, it } from "vitest";
import { getRouteAction } from "@/lib/auth/routes";

describe("getRouteAction", () => {
  describe("unauthenticated users", () => {
    it("allows access to the landing page", () => {
      expect(getRouteAction("/", false)).toEqual({ type: "next" });
    });

    it("allows access to the login page", () => {
      expect(getRouteAction("/login", false)).toEqual({ type: "next" });
    });

    it("allows access to the sign-up page", () => {
      expect(getRouteAction("/sign-up", false)).toEqual({ type: "next" });
    });

    it("redirects /app to login", () => {
      expect(getRouteAction("/app", false)).toEqual({
        type: "redirect",
        destination: "/login",
      });
    });

    it("redirects /app/dashboard to login", () => {
      expect(getRouteAction("/app/dashboard", false)).toEqual({
        type: "redirect",
        destination: "/login",
      });
    });

    it("redirects nested /app routes to login", () => {
      expect(getRouteAction("/app/settings/profile", false)).toEqual({
        type: "redirect",
        destination: "/login",
      });
    });

    it("does not redirect /application to login", () => {
      expect(getRouteAction("/application", false)).toEqual({ type: "next" });
    });
  });

  describe("authenticated users", () => {
    it("allows access to the landing page", () => {
      expect(getRouteAction("/", true)).toEqual({ type: "next" });
    });

    it("allows access to /app", () => {
      expect(getRouteAction("/app", true)).toEqual({ type: "next" });
    });

    it("allows access to /app/dashboard", () => {
      expect(getRouteAction("/app/dashboard", true)).toEqual({ type: "next" });
    });

    it("redirects /login to /app", () => {
      expect(getRouteAction("/login", true)).toEqual({
        type: "redirect",
        destination: "/app",
      });
    });

    it("redirects /sign-up to /app", () => {
      expect(getRouteAction("/sign-up", true)).toEqual({
        type: "redirect",
        destination: "/app",
      });
    });

    it("redirects nested login routes to /app", () => {
      expect(getRouteAction("/login/forgot-password", true)).toEqual({
        type: "redirect",
        destination: "/app",
      });
    });
  });
});