import { z } from "zod";

import { emprestimosListQuerySchema } from "./emprestimos-list-query-schema";

export const devolucoesListQuerySchema = emprestimosListQuerySchema.transform((query) => ({
  ...query,
  status: "returned" as const,
  devolucaoFrom: undefined,
  devolucaoTo: undefined,
}));

export type DevolucoesListQuery = z.infer<typeof devolucoesListQuerySchema>;
