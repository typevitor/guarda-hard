import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listHardwareOptionsServer } from "./hardwares-options-api";

vi.mock("@/lib/api/client", () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from "@/lib/api/client";

describe("listHardwareOptionsServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests /hardwares/options and parses hardware option payload", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce([
      {
        id: "hw-1",
        descricao: "Notebook",
        marca: "Dell",
        modelo: "Latitude 5420",
        codigoPatrimonio: "PAT-001",
      },
      {
        id: "hw-2",
        descricao: "Monitor",
        marca: "LG",
        modelo: "24MK430",
        codigoPatrimonio: "PAT-002",
      },
    ]);

    const result = await listHardwareOptionsServer();

    expect(apiClient).toHaveBeenCalledWith({
      path: "/hardwares/options",
      method: "GET",
      fallbackErrorMessage: "Nao foi possivel carregar hardwares disponiveis",
    });
    expect(result).toEqual([
      {
        id: "hw-1",
        descricao: "Notebook",
        marca: "Dell",
        modelo: "Latitude 5420",
        codigoPatrimonio: "PAT-001",
      },
      {
        id: "hw-2",
        descricao: "Monitor",
        marca: "LG",
        modelo: "24MK430",
        codigoPatrimonio: "PAT-002",
      },
    ]);
  });

  it("propagates normalized api errors", async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(
      new ApiError("Nao foi possivel carregar hardwares disponiveis", 500),
    );

    await expect(listHardwareOptionsServer()).rejects.toMatchObject({
      name: "ApiError",
      message: "Nao foi possivel carregar hardwares disponiveis",
      status: 500,
    });
  });

  it("throws zod parse error when backend payload shape is invalid", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce([
      {
        id: "hw-1",
        descricao: "Notebook",
        marca: "Dell",
        modelo: "Latitude 5420",
        codigoPatrimonio: 101,
      },
    ]);

    await expect(listHardwareOptionsServer()).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("throws zod parse error when backend payload has unexpected keys", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce([
      {
        id: "hw-1",
        descricao: "Notebook",
        marca: "Dell",
        modelo: "Latitude 5420",
        codigoPatrimonio: "PAT-001",
        status: "ativo",
      },
    ]);

    await expect(listHardwareOptionsServer()).rejects.toMatchObject({
      name: "ZodError",
    });
  });
});
