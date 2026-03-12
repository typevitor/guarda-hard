import { z } from 'zod';

export const healthSchema = z.object({
  ok: z.boolean(),
});

export type HealthSchema = z.infer<typeof healthSchema>;
