import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    toString: () => "",
  }),
}));

import { getDashboardData } from "./get-dashboard-data";

describe("getDashboardData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("aggregates hardware states into dashboard status cards", async () => {
    const data = await getDashboardData(async () => [
      { id: "1", funcionando: true, livre: true },
      { id: "2", funcionando: true, livre: false },
      { id: "3", funcionando: false, livre: false },
      { id: "4", funcionando: true, livre: true },
    ]);

    expect(data.cards).toEqual([
      { id: "disponivel", label: "Disponiveis", count: 2 },
      { id: "emprestado", label: "Emprestados", count: 1 },
      { id: "defeituoso", label: "Defeituosos", count: 1 },
    ]);
  });

  it("returns zero counts when hardware list is empty", async () => {
    const data = await getDashboardData(async () => []);

    expect(data.cards).toEqual([
      { id: "disponivel", label: "Disponiveis", count: 0 },
      { id: "emprestado", label: "Emprestados", count: 0 },
      { id: "defeituoso", label: "Defeituosos", count: 0 },
    ]);
  });

  it("counts defective and loaned hardware with edge combinations", async () => {
    const data = await getDashboardData(async () => [
      { id: "1", funcionando: false, livre: true },
      { id: "2", funcionando: false, livre: false },
      { id: "3", funcionando: true, livre: false },
      { id: "4", funcionando: true, livre: false },
    ]);

    expect(data.cards).toEqual([
      { id: "disponivel", label: "Disponiveis", count: 0 },
      { id: "emprestado", label: "Emprestados", count: 2 },
      { id: "defeituoso", label: "Defeituosos", count: 2 },
    ]);
  });

  it("uses default fetch path and parses API response array", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: "1", funcionando: true, livre: true },
        { id: "2", funcionando: true, livre: false },
      ],
    });

    vi.stubGlobal("fetch", fetchMock);

    const data = await getDashboardData();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(data.cards).toEqual([
      { id: "disponivel", label: "Disponiveis", count: 1 },
      { id: "emprestado", label: "Emprestados", count: 1 },
      { id: "defeituoso", label: "Defeituosos", count: 0 },
    ]);
  });

  it("returns zeroed cards when default fetch path fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const data = await getDashboardData();

    expect(data.cards).toEqual([
      { id: "disponivel", label: "Disponiveis", count: 0 },
      { id: "emprestado", label: "Emprestados", count: 0 },
      { id: "defeituoso", label: "Defeituosos", count: 0 },
    ]);
  });
});
