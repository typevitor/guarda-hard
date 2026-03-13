import { z } from 'zod';

export const emprestimoStatusFilterSchema = z.enum(['open', 'returned']);

export type EmprestimoStatusFilter = z.infer<typeof emprestimoStatusFilterSchema>;
