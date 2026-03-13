import { z } from 'zod';

const normalizePage = (value: unknown): number => {
  const raw = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  if (!Number.isInteger(raw) || raw < 1) {
    return 1;
  }

  return raw;
};

export const paginationQuerySchema = z
  .object({
    page: z.unknown().optional(),
    pageSize: z.unknown().optional(),
  })
  .transform(({ page }) => ({
    page: normalizePage(page),
    pageSize: 10 as const,
  }));

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().min(1),
    pageSize: z.literal(10),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  });

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
