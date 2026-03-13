import { z } from "zod";

export const emprestimoSchema = z.object({
  usuarioId: z.string().trim().min(1, "Usuario e obrigatorio"),
  hardwareId: z.string().trim().min(1, "Hardware e obrigatorio"),
});

export type EmprestimoPayload = z.infer<typeof emprestimoSchema>;
