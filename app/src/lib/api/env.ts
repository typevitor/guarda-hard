const DEFAULT_API_BASE_URL = "http://localhost:3001";

export function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!value) {
    return DEFAULT_API_BASE_URL;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}
