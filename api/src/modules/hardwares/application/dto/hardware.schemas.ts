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

export const createHardwareSchema = z.object({
  descricao: z.string().trim().min(1),
  marca: z.string().trim().min(1),
  modelo: z.string().trim().min(1),
  codigoPatrimonio: z.string().trim().min(1),
});

export const updateHardwareSchema = z
  .object({
    descricao: z.string().trim().min(1).optional(),
    marca: z.string().trim().min(1).optional(),
    modelo: z.string().trim().min(1).optional(),
    codigoPatrimonio: z.string().trim().min(1).optional(),
  })
  .refine(
    (payload) =>
      payload.descricao !== undefined ||
      payload.marca !== undefined ||
      payload.modelo !== undefined ||
      payload.codigoPatrimonio !== undefined,
    {
      message: 'Pelo menos um campo deve ser informado para atualizacao',
    },
  );

export const marcarDefeitoSchema = z.object({
  descricaoProblema: z.string().trim().min(1),
});

export const hardwareIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const hardwareListQuerySchema = paginationQuerySchema.and(
  z.object({
    search: z.string().trim().min(1).optional(),
    funcionando: booleanStringSchema.optional(),
    livre: booleanStringSchema.optional(),
  }),
) as z.ZodType<
  {
    page: number;
    pageSize: 10;
    search?: string;
    funcionando?: boolean;
    livre?: boolean;
  },
  z.ZodTypeDef,
  unknown
>;

export type CreateHardwareDto = z.infer<typeof createHardwareSchema>;
export type UpdateHardwareDto = z.infer<typeof updateHardwareSchema>;
export type MarcarDefeitoDto = z.infer<typeof marcarDefeitoSchema>;
export type HardwareIdParamDto = z.infer<typeof hardwareIdParamSchema>;
export type HardwareListQueryDto = z.infer<typeof hardwareListQuerySchema>;
