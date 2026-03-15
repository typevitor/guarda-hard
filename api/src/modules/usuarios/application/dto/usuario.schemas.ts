import { z } from 'zod';

const paginationQuerySchema = z
  .object({
    page: z.union([z.string(), z.number()]).optional(),
    pageSize: z.union([z.string(), z.number()]).optional(),
  })
  .transform(({ page }) => {
    const parsed = Number(page);

    return {
      page: Number.isInteger(parsed) && parsed > 0 ? parsed : 1,
      pageSize: 10 as const,
    };
  });

const booleanStringSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const createUsuarioSchema = z.object({
  departamentoId: z.string().uuid().nullable().optional(),
  nome: z.string().trim().min(1),
  email: z.string().trim().email(),
  senhaHash: z.string().trim().min(1).optional(),
});

export const updateUsuarioSchema = z
  .object({
    departamentoId: z.string().uuid().nullable().optional(),
    nome: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    senhaHash: z.string().trim().min(1).optional(),
    ativo: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      payload.departamentoId !== undefined ||
      payload.nome !== undefined ||
      payload.email !== undefined ||
      payload.senhaHash !== undefined ||
      payload.ativo !== undefined,
    {
      message: 'Pelo menos um campo deve ser informado para atualizacao',
    },
  );

export const usuarioIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const usuarioListQuerySchema = paginationQuerySchema.and(
  z.object({
    search: z.string().trim().min(1).optional(),
    departamentoId: z.string().uuid().optional(),
    ativo: booleanStringSchema.optional(),
  }),
) as z.ZodType<
  {
    page: number;
    pageSize: 10;
    search?: string;
    departamentoId?: string;
    ativo?: boolean;
  },
  z.ZodTypeDef,
  unknown
>;

export type CreateUsuarioDto = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioDto = z.infer<typeof updateUsuarioSchema>;
export type UsuarioIdParamDto = z.infer<typeof usuarioIdParamSchema>;
export type UsuarioListQueryDto = z.infer<typeof usuarioListQuerySchema>;
