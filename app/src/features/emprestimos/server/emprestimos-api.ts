import { apiClient } from "@/lib/api/client";

import {
  devolucaoSchema,
  emprestimoSchema,
  type DevolucaoPayload,
  type EmprestimoPayload,
} from "../schemas/emprestimo-schema";

export async function createEmprestimoServer(payload: EmprestimoPayload): Promise<void> {
  const parsedPayload = emprestimoSchema.parse(payload);

  await apiClient({
    path: "/emprestimos",
    method: "POST",
    body: parsedPayload,
    responseType: "void",
    fallbackErrorMessage: "Nao foi possivel registrar emprestimo",
  });
}

export async function createDevolucaoServer(payload: DevolucaoPayload): Promise<void> {
  const parsedPayload = devolucaoSchema.parse(payload);

  await apiClient({
    path: `/emprestimos/${encodeURIComponent(parsedPayload.emprestimoId)}/devolucao`,
    method: "POST",
    responseType: "void",
    fallbackErrorMessage: "Nao foi possivel registrar devolucao",
  });
}
