import { z } from "zod";

import { apiClient } from "@/lib/api/client";

import type { HardwaresListQuery } from "../schemas/hardwares-list-query-schema";

const hardwareListItemSchema = z.object({
  id: z.string(),
  empresaId: z.string(),
  descricao: z.string(),
  marca: z.string(),
  modelo: z.string(),
  codigoPatrimonio: z.string(),
  funcionando: z.boolean(),
  descricaoProblema: z.string().nullable(),
  livre: z.boolean(),
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const hardwareListResponseSchema = z.object({
  items: z.array(hardwareListItemSchema),
  page: z.number().int().min(1),
  pageSize: z.literal(10),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type HardwareListItem = z.infer<typeof hardwareListItemSchema>;
export type HardwareListResponse = z.infer<typeof hardwareListResponseSchema>;

export async function listHardwaresServer(
  query: HardwaresListQuery,
): Promise<HardwareListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(query.page));

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.livre !== undefined) {
    params.set("livre", String(query.livre));
  }

  if (query.funcionando !== undefined) {
    params.set("funcionando", String(query.funcionando));
  }

  const payload = await apiClient({
    path: `/hardwares?${params.toString()}`,
    method: "GET",
    fallbackErrorMessage: "Nao foi possivel carregar hardwares",
  });

  return hardwareListResponseSchema.parse(payload);
}
