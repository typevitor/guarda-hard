import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listUsuarioOptionsServer } from "./usuarios-options-api";

vi.mock("@/lib/api/client", () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from "@/lib/api/client";

describe("listUsuarioOptionsServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests /usuarios/options and parses id/nome array", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce([
      { id: "user-1", nome: "Maria" },
      { id: "user-2", nome: "Joao" },
    ]);

    const result = await listUsuarioOptionsServer();

    expect(apiClient).toHaveBeenCalledWith({
      path: "/usuarios/options",
      method: "GET",
      fallbackErrorMessage: "Nao foi possivel carregar usuarios",
    });
    expect(result).toEqual([
      { id: "user-1", nome: "Maria" },
      { id: "user-2", nome: "Joao" },
    ]);
  });

  it("propagates normalized api errors", async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(new ApiError("Nao foi possivel carregar usuarios", 500));

    await expect(listUsuarioOptionsServer()).rejects.toMatchObject({
      name: "ApiError",
      message: "Nao foi possivel carregar usuarios",
      status: 500,
    });
  });

  it("throws zod parse error when backend payload shape is invalid", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce([{ id: 123, nome: "Maria" }]);

    await expect(listUsuarioOptionsServer()).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("throws zod parse error when backend payload has unexpected keys", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce([
      { id: "user-1", nome: "Maria", departamento: "Financeiro" },
    ]);

    await expect(listUsuarioOptionsServer()).rejects.toMatchObject({
      name: "ZodError",
    });
  });
});
