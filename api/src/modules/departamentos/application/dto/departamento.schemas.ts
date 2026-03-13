import { z } from 'zod';

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

export type CreateDepartamentoDto = z.infer<typeof createDepartamentoSchema>;
export type UpdateDepartamentoDto = z.infer<typeof updateDepartamentoSchema>;
export type DepartamentoIdParamDto = z.infer<typeof departamentoIdParamSchema>;
