import { z } from "zod";

import { apiClient } from "@/lib/api/client";

const departamentoOptionSchema = z.object({
  id: z.string(),
  nome: z.string(),
});

const departamentoOptionsSchema = z.array(departamentoOptionSchema);

export type DepartamentoOption = z.infer<typeof departamentoOptionSchema>;

export async function listDepartamentoOptionsServer(): Promise<DepartamentoOption[]> {
  const payload = await apiClient({
    path: "/departamentos/options",
    method: "GET",
    fallbackErrorMessage: "Nao foi possivel carregar departamentos",
  });

  return departamentoOptionsSchema.parse(payload);
}
