import { z } from "zod";

export const usuarioSchema = z.object({
  nome: z.string().trim().min(1, "Nome e obrigatorio"),
  email: z.string().trim().email("Email invalido"),
  departamentoId: z.string().trim().optional(),
});

export type UsuarioPayload = z.infer<typeof usuarioSchema>;
