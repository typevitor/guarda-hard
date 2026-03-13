import { describe, expect, it } from "vitest";

import { getDashboardData } from "./get-dashboard-data";

describe("getDashboardData", () => {
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
});
