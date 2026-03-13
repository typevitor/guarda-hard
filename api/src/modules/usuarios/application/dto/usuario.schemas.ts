import { z } from 'zod';

export const createUsuarioSchema = z.object({
  departamentoId: z.string().uuid(),
  nome: z.string().trim().min(1),
  email: z.string().trim().email(),
});

export const updateUsuarioSchema = z
  .object({
    nome: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    ativo: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      payload.nome !== undefined ||
      payload.email !== undefined ||
      payload.ativo !== undefined,
    {
      message: 'Pelo menos um campo deve ser informado para atualizacao',
    },
  );

export const usuarioIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateUsuarioDto = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioDto = z.infer<typeof updateUsuarioSchema>;
export type UsuarioIdParamDto = z.infer<typeof usuarioIdParamSchema>;
