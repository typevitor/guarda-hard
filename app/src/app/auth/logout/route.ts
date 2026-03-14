import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api/env";

export async function POST(): Promise<NextResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
  });

  const body = await response.text();
  const nextResponse = new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
    },
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    nextResponse.headers.set("set-cookie", setCookie);
  }

  return nextResponse;
}
