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

    it("redirects /dashboard to login", () => {
      expect(getRouteAction("/dashboard", false)).toEqual({
        type: "redirect",
        destination: "/login",
      });
    });

    it("redirects /dashboard/reports to login", () => {
      expect(getRouteAction("/dashboard/reports", false)).toEqual({
        type: "redirect",
        destination: "/login",
      });
    });

    it("redirects nested /dashboard routes to login", () => {
      expect(getRouteAction("/dashboard/settings/profile", false)).toEqual({
        type: "redirect",
        destination: "/login",
      });
    });

    it("does not redirect /dashboardboard to login", () => {
      expect(getRouteAction("/dashboardboard", false)).toEqual({ type: "next" });
    });
  });

  describe("authenticated users", () => {
    it("allows access to the landing page", () => {
      expect(getRouteAction("/", true)).toEqual({ type: "next" });
    });

    it("allows access to /dashboard", () => {
      expect(getRouteAction("/dashboard", true)).toEqual({ type: "next" });
    });

    it("allows access to /dashboard/reports", () => {
      expect(getRouteAction("/dashboard/reports", true)).toEqual({ type: "next" });
    });

    it("redirects /login to /dashboard", () => {
      expect(getRouteAction("/login", true)).toEqual({
        type: "redirect",
        destination: "/dashboard",
      });
    });

    it("redirects /sign-up to /dashboard", () => {
      expect(getRouteAction("/sign-up", true)).toEqual({
        type: "redirect",
        destination: "/dashboard",
      });
    });

    it("redirects nested login routes to /dashboard", () => {
      expect(getRouteAction("/login/forgot-password", true)).toEqual({
        type: "redirect",
        destination: "/dashboard",
      });
    });
  });
});