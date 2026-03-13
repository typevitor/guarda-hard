import { z } from "zod";

export const hardwareSchema = z.object({
  descricao: z.string().trim().min(1, "Descricao e obrigatoria"),
  codigoPatrimonio: z.string().trim().min(1, "Codigo patrimonio e obrigatorio"),
});

export type HardwarePayload = z.infer<typeof hardwareSchema>;
