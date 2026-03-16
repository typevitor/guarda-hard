import { z } from "zod";

export const hardwareSchema = z.object({
  descricao: z.string().trim().min(1, "Descricao e obrigatoria"),
  marca: z.string().trim().min(1, "Marca e obrigatoria"),
  modelo: z.string().trim().min(1, "Modelo e obrigatorio"),
  codigoPatrimonio: z.string().trim().min(1, "Codigo patrimonio e obrigatorio"),
});

export type HardwarePayload = z.infer<typeof hardwareSchema>;
