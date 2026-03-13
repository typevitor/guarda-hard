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

const emprestimoStatusFilterSchema = z.enum(['open', 'returned']);

const isoDateStringSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime({ local: true }));

export const createEmprestimoSchema = z.object({
  usuarioId: z.string().uuid(),
  hardwareId: z.string().uuid(),
});

export const emprestimoIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const emprestimoListQuerySchema = paginationQuerySchema.and(
  z.object({
    search: z.string().trim().min(1).optional(),
    usuarioId: z.string().uuid().optional(),
    hardwareId: z.string().uuid().optional(),
    retiradaFrom: isoDateStringSchema.optional(),
    retiradaTo: isoDateStringSchema.optional(),
    devolucaoFrom: isoDateStringSchema.optional(),
    devolucaoTo: isoDateStringSchema.optional(),
    status: emprestimoStatusFilterSchema.optional(),
  }),
);

export type CreateEmprestimoDto = z.infer<typeof createEmprestimoSchema>;
export type EmprestimoIdParamDto = z.infer<typeof emprestimoIdParamSchema>;
export type EmprestimoListQueryDto = z.infer<typeof emprestimoListQuerySchema>;
