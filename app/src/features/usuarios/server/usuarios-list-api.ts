import { z } from "zod";

import { apiClient } from "@/lib/api/client";

import type { UsuariosListQuery } from "../schemas/usuarios-list-query-schema";

const usuarioListItemSchema = z.object({
  id: z.string(),
  empresaId: z.string(),
  departamentoId: z.string(),
  nome: z.string(),
  email: z.string(),
  ativo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const usuarioListResponseSchema = z.object({
  items: z.array(usuarioListItemSchema),
  page: z.number().int().min(1),
  pageSize: z.literal(10),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type UsuarioListItem = z.infer<typeof usuarioListItemSchema>;
export type UsuarioListResponse = z.infer<typeof usuarioListResponseSchema>;

export async function listUsuariosServer(query: UsuariosListQuery): Promise<UsuarioListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(query.page));

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.departamentoId) {
    params.set("departamentoId", query.departamentoId);
  }

  if (query.ativo !== undefined) {
    params.set("ativo", String(query.ativo));
  }

  const payload = await apiClient({
    path: `/usuarios?${params.toString()}`,
    method: "GET",
    fallbackErrorMessage: "Nao foi possivel carregar usuarios",
  });

  return usuarioListResponseSchema.parse(payload);
}
