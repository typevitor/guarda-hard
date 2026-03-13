import { cookies } from "next/headers";

import {
  departamentoSchema,
  type DepartamentoPayload,
} from "../schemas/departamento-schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function createDepartamentoServer(payload: DepartamentoPayload): Promise<void> {
  const parsedPayload = departamentoSchema.parse(payload);
  const cookieHeader = (await cookies()).toString();

  const response = await fetch(`${API_BASE_URL}/departamentos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(parsedPayload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel criar departamento");
  }
}
