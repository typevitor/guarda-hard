import type { DepartamentoFormValues } from "../forms/departamento-form";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function createDepartamento(payload: DepartamentoFormValues): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/departamentos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel criar departamento");
  }
}
