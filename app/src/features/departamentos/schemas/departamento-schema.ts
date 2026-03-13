import { z } from "zod";

export const departamentoSchema = z.object({
  nome: z.string().trim().min(1, "Nome e obrigatorio"),
});

export type DepartamentoPayload = z.infer<typeof departamentoSchema>;
