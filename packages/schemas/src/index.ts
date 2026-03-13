import { z } from 'zod';
export {
  paginatedResponseSchema,
  paginationQuerySchema,
  type PaginationQuery,
} from './pagination';
export {
  emprestimoStatusFilterSchema,
  type EmprestimoStatusFilter,
} from './list-filters';

export const healthSchema = z.object({
  ok: z.boolean(),
});

export type HealthSchema = z.infer<typeof healthSchema>;
