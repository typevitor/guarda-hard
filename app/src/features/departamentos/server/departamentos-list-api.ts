import { z } from "zod";

import { apiClient } from "@/lib/api/client";

import type { DepartamentosListQuery } from "../schemas/departamentos-list-query-schema";

const departamentoListItemSchema = z.object({
  id: z.string(),
  empresaId: z.string(),
  nome: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const departamentoListResponseSchema = z.object({
  items: z.array(departamentoListItemSchema),
  page: z.number().int().min(1),
  pageSize: z.literal(10),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type DepartamentoListItem = z.infer<typeof departamentoListItemSchema>;
export type DepartamentoListResponse = z.infer<typeof departamentoListResponseSchema>;

export async function listDepartamentosServer(
  query: DepartamentosListQuery,
): Promise<DepartamentoListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(query.page));

  if (query.search) {
    params.set("search", query.search);
  }

  const payload = await apiClient({
    path: `/departamentos?${params.toString()}`,
    method: "GET",
    fallbackErrorMessage: "Nao foi possivel carregar departamentos",
  });

  return departamentoListResponseSchema.parse(payload);
}
