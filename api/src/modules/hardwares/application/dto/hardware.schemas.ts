import { z } from 'zod';

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

export type CreateHardwareDto = z.infer<typeof createHardwareSchema>;
export type UpdateHardwareDto = z.infer<typeof updateHardwareSchema>;
export type MarcarDefeitoDto = z.infer<typeof marcarDefeitoSchema>;
export type HardwareIdParamDto = z.infer<typeof hardwareIdParamSchema>;
