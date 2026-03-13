import { cookies } from "next/headers";

import {
  emprestimoSchema,
  type EmprestimoPayload,
} from "../schemas/emprestimo-schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function createEmprestimoServer(payload: EmprestimoPayload): Promise<void> {
  const parsedPayload = emprestimoSchema.parse(payload);
  const cookieHeader = (await cookies()).toString();

  const response = await fetch(`${API_BASE_URL}/emprestimos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(parsedPayload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel registrar emprestimo");
  }
}
