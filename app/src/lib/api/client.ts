import { ApiError, toApiError } from "./errors";
import { getApiBaseUrl } from "./env";

type ApiClientOptions = {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  responseType?: "json" | "void";
  fallbackErrorMessage: string;
};

export async function apiClient<T = void>({
  path,
  method = "GET",
  body,
  responseType = "json",
  fallbackErrorMessage,
}: ApiClientOptions): Promise<T> {
  const cookieHeader = await getServerCookieHeader();
  const headers: HeadersInit = {};

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
  });

  await syncAuthCookieFromResponse(response.headers);

  if (!response.ok) {
    throw await toApiError(response, fallbackErrorMessage);
  }

  if (responseType === "void") {
    return undefined as T;
  }

  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(fallbackErrorMessage, response.status);
  }
}

async function syncAuthCookieFromResponse(headers?: Headers): Promise<void> {
  if (typeof window !== "undefined") {
    return;
  }

  const setCookieHeaders = getSetCookieHeaders(headers).filter((header) =>
    header.startsWith("gh_session="),
  );

  if (setCookieHeaders.length === 0) {
    return;
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    for (const header of setCookieHeaders) {
      const [pair, ...attributes] = header.split(";").map((part) => part.trim());
      if (!pair) {
        continue;
      }

      const separatorIndex = pair.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const name = pair.slice(0, separatorIndex);
      const value = pair.slice(separatorIndex + 1);

      const maxAgeAttr = attributes.find((attr) => attr.toLowerCase().startsWith("max-age="));
      const maxAge = maxAgeAttr ? Number(maxAgeAttr.split("=")[1]) : undefined;

      if (!value || maxAge === 0) {
        cookieStore.delete(name);
        continue;
      }

      cookieStore.set({
        name,
        value,
        path: parsePathAttribute(attributes),
        httpOnly: attributes.some((attr) => attr.toLowerCase() === "httponly"),
        secure: attributes.some((attr) => attr.toLowerCase() === "secure"),
        sameSite: parseSameSiteAttribute(attributes),
      });
    }
  } catch {
    // Ignore when called from contexts where response cookies are immutable.
  }
}

function getSetCookieHeaders(headers?: Headers): string[] {
  if (!headers) {
    return [];
  }

  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withGetSetCookie.getSetCookie === "function") {
    return withGetSetCookie.getSetCookie();
  }

  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function parsePathAttribute(attributes: string[]): string {
  const pathAttr = attributes.find((attr) => attr.toLowerCase().startsWith("path="));
  return pathAttr ? pathAttr.slice(pathAttr.indexOf("=") + 1) : "/";
}

function parseSameSiteAttribute(attributes: string[]): "lax" | "strict" | "none" {
  const raw = attributes
    .find((attr) => attr.toLowerCase().startsWith("samesite="))
    ?.split("=")[1]
    ?.toLowerCase();

  if (raw === "strict") {
    return "strict";
  }

  if (raw === "none") {
    return "none";
  }

  return "lax";
}

async function getServerCookieHeader(): Promise<string> {
  if (typeof window !== "undefined") {
    return "";
  }

  const { cookies } = await import("next/headers");
  return (await cookies()).toString();
}
