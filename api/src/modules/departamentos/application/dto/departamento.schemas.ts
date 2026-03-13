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

export const createDepartamentoSchema = z.object({
  nome: z.string().trim().min(1),
});

export const updateDepartamentoSchema = z
  .object({
    nome: z.string().trim().min(1).optional(),
  })
  .refine((payload) => payload.nome !== undefined, {
    message: 'Pelo menos um campo deve ser informado para atualizacao',
  });

export const departamentoIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const departamentoListQuerySchema = paginationQuerySchema.and(
  z.object({
    search: z.string().trim().min(1).optional(),
  }),
) as z.ZodType<
  {
    page: number;
    pageSize: 10;
    search?: string;
  },
  z.ZodTypeDef,
  unknown
>;

export type CreateDepartamentoDto = z.infer<typeof createDepartamentoSchema>;
export type UpdateDepartamentoDto = z.infer<typeof updateDepartamentoSchema>;
export type DepartamentoIdParamDto = z.infer<typeof departamentoIdParamSchema>;
export type DepartamentoListQueryDto = z.infer<typeof departamentoListQuerySchema>;
