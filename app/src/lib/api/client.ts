import { cookies } from "next/headers";

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
  const cookieHeader = (await cookies()).toString();
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
  });

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
