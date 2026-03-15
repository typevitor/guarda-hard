import { z } from 'zod';

import { ApiError } from '@/lib/api/errors';

const devolucaoSelectorItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const devolucaoSelectorResponseSchema = z.object({
  items: z.array(devolucaoSelectorItemSchema),
  page: z.number().int().min(1),
  totalPages: z.number().int().min(1),
});

export type DevolucaoSelectorOption = z.infer<typeof devolucaoSelectorItemSchema>;

export async function fetchOpenEmprestimosForDevolucao(
  page: number,
  search?: string,
): Promise<{ items: DevolucaoSelectorOption[]; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  params.set('page', String(page));

  const normalizedSearch = search?.trim();
  if (normalizedSearch) {
    params.set('search', normalizedSearch);
  }

  const response = await fetch(`/api/emprestimos/open?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError('Nao foi possivel carregar emprestimos em aberto', response.status);
  }

  const payload = (await response.json()) as unknown;
  return devolucaoSelectorResponseSchema.parse(payload);
}
