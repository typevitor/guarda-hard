import { afterEach, describe, expect, it, vi } from "vitest";

function mockCookies(value: string) {
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      toString: () => value,
    }),
  }));
}

async function loadClient(cookieValue = "session=abc") {
  mockCookies(cookieValue);
  return import("./client");
}

describe("apiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("forwards cookies to API requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { apiClient } = await loadClient("session=tenant-1");

    await apiClient<{ ok: boolean }>({
      path: "/hardwares",
      method: "GET",
      fallbackErrorMessage: "falha",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/hardwares",
      expect.objectContaining({
        headers: expect.objectContaining({ Cookie: "session=tenant-1" }),
      }),
    );
  });

  it("uses fallback message when error body is not parseable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("gateway down", {
        status: 502,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { apiClient } = await loadClient();

    await expect(
      apiClient({ path: "/relatorios", method: "GET", fallbackErrorMessage: "erro padrao" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      message: "erro padrao",
      status: 502,
    });
  });

  it("returns undefined for 204 no-content response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 204,
        }),
      ),
    );

    const { apiClient } = await loadClient();

    const result = await apiClient({
      path: "/emprestimos/1/devolucao",
      method: "POST",
      fallbackErrorMessage: "falha",
    });

    expect(result).toBeUndefined();
  });

  it("throws normalized ApiError when successful response has invalid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("{invalid-json", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const { apiClient } = await loadClient();

    await expect(
      apiClient({ path: "/hardwares", method: "GET", fallbackErrorMessage: "json invalido" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      message: "json invalido",
      status: 200,
    });
  });

  it("throws normalized ApiError when successful response body is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const { apiClient } = await loadClient();

    await expect(
      apiClient({ path: "/usuarios", method: "GET", fallbackErrorMessage: "resposta invalida" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      message: "resposta invalida",
      status: 200,
    });
  });
});
