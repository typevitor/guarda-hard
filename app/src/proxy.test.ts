import { describe, expect, it } from "vitest";

import { resolveProxyRedirect } from "./proxy";

function makeSessionCookie(payload: { userId: string; empresaId?: string }): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `gh_session=${encodedPayload}.signature`;
}

describe("resolveProxyRedirect", () => {
  it("redirects unauthenticated access to /dashboard -> /", () => {
    expect(resolveProxyRedirect("/dashboard")).toBe("/");
  });

  it("redirects unauthenticated access to /select-company -> /", () => {
    expect(resolveProxyRedirect("/select-company")).toBe("/");
  });

  it("redirects phase-A session from /dashboard -> /select-company", () => {
    const cookie = makeSessionCookie({ userId: "user-1" });
    expect(resolveProxyRedirect("/dashboard", cookie)).toBe("/select-company");
  });

  it("allows phase-A session access to /select-company", () => {
    const cookie = makeSessionCookie({ userId: "user-1" });
    expect(resolveProxyRedirect("/select-company", cookie)).toBeNull();
  });

  it("redirects phase-B session from / -> /dashboard", () => {
    const cookie = makeSessionCookie({ userId: "user-1", empresaId: "empresa-1" });
    expect(resolveProxyRedirect("/", cookie)).toBe("/dashboard");
  });

  it("redirects phase-B session from /select-company -> /dashboard", () => {
    const cookie = makeSessionCookie({ userId: "user-1", empresaId: "empresa-1" });
    expect(resolveProxyRedirect("/select-company", cookie)).toBe("/dashboard");
  });

  it("allows phase-B session access to protected routes", () => {
    const cookie = makeSessionCookie({ userId: "user-1", empresaId: "empresa-1" });
    expect(resolveProxyRedirect("/dashboard", cookie)).toBeNull();
  });

  it("always allows static assets", () => {
    expect(resolveProxyRedirect("/_next/static/chunk.js")).toBeNull();
    expect(resolveProxyRedirect("/favicon.ico")).toBeNull();
  });
});
