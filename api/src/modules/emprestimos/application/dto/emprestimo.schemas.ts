import { z } from 'zod';

export const createEmprestimoSchema = z.object({
  usuarioId: z.string().uuid(),
  hardwareId: z.string().uuid(),
});

export const emprestimoIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateEmprestimoDto = z.infer<typeof createEmprestimoSchema>;
export type EmprestimoIdParamDto = z.infer<typeof emprestimoIdParamSchema>;
