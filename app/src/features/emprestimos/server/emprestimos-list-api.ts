import { z } from "zod";

import { apiClient } from "@/lib/api/client";

import type { EmprestimosListQuery } from "../schemas/emprestimos-list-query-schema";

const emprestimoListItemSchema = z.object({
  id: z.string(),
  empresaId: z.string(),
  usuarioId: z.string(),
  hardwareId: z.string(),
  dataRetirada: z.string(),
  dataDevolucao: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const emprestimoListResponseSchema = z.object({
  items: z.array(emprestimoListItemSchema),
  page: z.number().int().min(1),
  pageSize: z.literal(10),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type EmprestimoListItem = z.infer<typeof emprestimoListItemSchema>;
export type EmprestimoListResponse = z.infer<typeof emprestimoListResponseSchema>;

export async function listEmprestimosServer(
  query: EmprestimosListQuery,
): Promise<EmprestimoListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("status", query.status);

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.usuarioId) {
    params.set("usuarioId", query.usuarioId);
  }

  if (query.hardwareId) {
    params.set("hardwareId", query.hardwareId);
  }

  if (query.retiradaFrom) {
    params.set("retiradaFrom", query.retiradaFrom);
  }

  if (query.retiradaTo) {
    params.set("retiradaTo", query.retiradaTo);
  }

  const payload = await apiClient({
    path: `/emprestimos?${params.toString()}`,
    method: "GET",
    fallbackErrorMessage: "Nao foi possivel carregar emprestimos",
  });

  return emprestimoListResponseSchema.parse(payload);
}
