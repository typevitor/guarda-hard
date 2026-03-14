import { NextResponse, type NextRequest } from "next/server";

type SessionPayload = {
  userId: string;
  empresaId?: string;
};

function isStaticAssetPath(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) {
    return true;
  }

  if (pathname === "/favicon.ico") {
    return true;
  }

  return /\.[^/]+$/.test(pathname);
}

function extractSessionToken(cookieOrToken?: string | null): string | null {
  if (!cookieOrToken) {
    return null;
  }

  if (!cookieOrToken.includes("=")) {
    return cookieOrToken;
  }

  const parts = cookieOrToken.split(";").map((part) => part.trim());
  const pair = parts.find((part) => part.startsWith("gh_session="));

  return pair ? pair.slice("gh_session=".length) : null;
}

function parseSessionPayload(token: string | null): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload] = token.split(".");

  if (!encodedPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as Partial<SessionPayload> | null;

    if (!parsed?.userId || typeof parsed.userId !== "string") {
      return null;
    }

    return {
      userId: parsed.userId,
      empresaId: typeof parsed.empresaId === "string" ? parsed.empresaId : undefined,
    };
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return Buffer.from(padded, "base64").toString("utf8");
}

export function resolveProxyRedirect(pathname: string, cookieOrToken?: string | null): string | null {
  if (isStaticAssetPath(pathname)) {
    return null;
  }

  const session = parseSessionPayload(extractSessionToken(cookieOrToken));
  const isRoot = pathname === "/";
  const isSelectCompany = pathname === "/select-company";
  const isProtectedRoute = !isRoot && !isSelectCompany;

  if (!session) {
    if (isProtectedRoute || isSelectCompany) {
      return "/";
    }

    return null;
  }

  const hasTenant = Boolean(session.empresaId);

  if (!hasTenant) {
    if (isProtectedRoute) {
      return "/select-company";
    }

    return null;
  }

  if (isRoot || isSelectCompany) {
    return "/dashboard";
  }

  return null;
}

export function proxy(request: NextRequest) {
  const redirectPath = resolveProxyRedirect(
    request.nextUrl.pathname,
    request.cookies.get("gh_session")?.value,
  );

  if (!redirectPath) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = redirectPath;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/:path*"],
};
