import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listDepartamentoOptionsServer } from "./departamentos-options-api";

vi.mock("@/lib/api/client", () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from "@/lib/api/client";

describe("listDepartamentoOptionsServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests /departamentos/options and parses id/nome array", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce([
      { id: "dep-1", nome: "Administracao" },
      { id: "dep-2", nome: "Suporte" },
    ]);

    const result = await listDepartamentoOptionsServer();

    expect(apiClient).toHaveBeenCalledWith({
      path: "/departamentos/options",
      method: "GET",
      fallbackErrorMessage: "Nao foi possivel carregar departamentos",
    });
    expect(result).toEqual([
      { id: "dep-1", nome: "Administracao" },
      { id: "dep-2", nome: "Suporte" },
    ]);
  });

  it("propagates normalized api errors", async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(
      new ApiError("Nao foi possivel carregar departamentos", 500),
    );

    await expect(listDepartamentoOptionsServer()).rejects.toMatchObject({
      name: "ApiError",
      message: "Nao foi possivel carregar departamentos",
      status: 500,
    });
  });

  it("throws when backend payload shape is invalid", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce([
      { id: 123, nome: "Suporte" },
    ]);

    await expect(listDepartamentoOptionsServer()).rejects.toThrow();
  });
});
