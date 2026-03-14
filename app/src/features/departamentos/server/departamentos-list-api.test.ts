import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listDepartamentosServer } from "./departamentos-list-api";

vi.mock("@/lib/api/client", () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from "@/lib/api/client";

describe("listDepartamentosServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests departamentos list with page and search and parses payload", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      items: [
        {
          id: "dep-1",
          empresaId: "emp-1",
          nome: "Suporte",
          createdAt: "2026-03-13T10:00:00.000Z",
          updatedAt: "2026-03-13T11:00:00.000Z",
        },
      ],
      page: 2,
      pageSize: 10,
      total: 11,
      totalPages: 2,
    });

    const result = await listDepartamentosServer({
      page: 2,
      pageSize: 10,
      search: "sup",
    });

    expect(apiClient).toHaveBeenCalledWith({
      path: "/departamentos?page=2&search=sup",
      method: "GET",
      fallbackErrorMessage: "Nao foi possivel carregar departamentos",
    });
    expect(result).toEqual({
      items: [
        {
          id: "dep-1",
          empresaId: "emp-1",
          nome: "Suporte",
          createdAt: "2026-03-13T10:00:00.000Z",
          updatedAt: "2026-03-13T11:00:00.000Z",
        },
      ],
      page: 2,
      pageSize: 10,
      total: 11,
      totalPages: 2,
    });
  });

  it("propagates normalized api errors", async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(
      new ApiError("Nao foi possivel carregar departamentos", 500),
    );

    await expect(
      listDepartamentosServer({
        page: 1,
        pageSize: 10,
        search: "",
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      message: "Nao foi possivel carregar departamentos",
      status: 500,
    });
  });

  it("throws when backend payload shape is invalid", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      items: [],
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 0,
    });

    await expect(
      listDepartamentosServer({
        page: 1,
        pageSize: 10,
        search: "",
      }),
    ).rejects.toThrow();
  });
});
