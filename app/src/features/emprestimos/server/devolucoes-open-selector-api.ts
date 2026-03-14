import { z } from "zod";

import { listEmprestimosServer } from "./emprestimos-list-api";

const devolucaoSelectorItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const devolucaoSelectorResponseSchema = z.object({
  items: z.array(devolucaoSelectorItemSchema),
  page: z.number().int().min(1),
  totalPages: z.number().int().min(1),
});

export type DevolucaoSelectorOption = z.infer<typeof devolucaoSelectorItemSchema>;

export async function listOpenEmprestimosForDevolucao(
  page: number,
  search?: string,
): Promise<{ items: DevolucaoSelectorOption[]; page: number; totalPages: number }> {
  const list = await listEmprestimosServer({
    page,
    pageSize: 10,
    search: search?.trim() ?? "",
    status: "open",
    usuarioId: "",
    hardwareId: "",
    retiradaFrom: undefined,
    retiradaTo: undefined,
  });

  const mapped = {
    items: list.items.map((item) => ({
      value: item.id,
      label: `${item.id} - usuario ${item.usuarioId} - hardware ${item.hardwareId}`,
    })),
    page: list.page,
    totalPages: Math.max(list.totalPages, 1),
  };

  return devolucaoSelectorResponseSchema.parse(mapped);
}
