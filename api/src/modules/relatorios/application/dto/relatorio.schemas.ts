import { z } from 'zod';

export const relatorioStatusSchema = z.enum([
  'disponivel',
  'emprestado',
  'defeituoso',
]);

export const relatorioHardwaresQuerySchema = z.object({
  status: relatorioStatusSchema.optional(),
});

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const relatorioEmprestimosQuerySchema = z
  .object({
    status: relatorioStatusSchema.optional(),
    periodoInicio: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) =>
          value === undefined || value.length === 0 || DATE_PATTERN.test(value),
        {
          message: 'Data inicial invalida',
        },
      ),
    periodoFim: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) =>
          value === undefined || value.length === 0 || DATE_PATTERN.test(value),
        {
          message: 'Data final invalida',
        },
      ),
    usuario: z.string().trim().optional(),
    hardware: z.string().trim().optional(),
  })
  .refine(
    (value) => {
      if (!value.periodoInicio || !value.periodoFim) {
        return true;
      }

      return value.periodoInicio <= value.periodoFim;
    },
    {
      message: 'Periodo inicial deve ser anterior ao final',
      path: ['periodoFim'],
    },
  );

export type RelatorioStatusDto = z.infer<typeof relatorioStatusSchema>;
export type RelatorioHardwaresQueryDto = z.infer<
  typeof relatorioHardwaresQuerySchema
>;
export type RelatorioEmprestimosQueryDto = z.infer<
  typeof relatorioEmprestimosQuerySchema
>;
