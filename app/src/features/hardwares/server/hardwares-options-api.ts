import { z } from "zod";

import { apiClient } from "@/lib/api/client";

const hardwareOptionSchema = z.object({
  id: z.string(),
  descricao: z.string(),
  marca: z.string(),
  modelo: z.string(),
  codigoPatrimonio: z.string(),
});

const hardwareOptionsSchema = z.array(hardwareOptionSchema);

export type HardwareOption = z.infer<typeof hardwareOptionSchema>;

export async function listHardwareOptionsServer(): Promise<HardwareOption[]> {
  const payload = await apiClient({
    path: "/hardwares/options",
    method: "GET",
    fallbackErrorMessage: "Nao foi possivel carregar hardwares disponiveis",
  });

  return hardwareOptionsSchema.parse(payload);
}
