import { z } from "zod";

export const emprestimoSchema = z.object({
  usuarioId: z.string().trim().min(1, "Usuario e obrigatorio"),
  hardwareId: z.string().trim().min(1, "Hardware e obrigatorio"),
});

export const devolucaoSchema = z.object({
  emprestimoId: z.string().trim().min(1, "Emprestimo e obrigatorio"),
});

export type EmprestimoPayload = z.infer<typeof emprestimoSchema>;
export type DevolucaoPayload = z.infer<typeof devolucaoSchema>;
