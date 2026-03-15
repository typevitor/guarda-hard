import { DevolucaoPage } from '@/features/emprestimos/components/devolucao-page';
import { devolucoesListQuerySchema } from '@/features/emprestimos/schemas/devolucoes-list-query-schema';
import type { DevolucaoPayload } from '@/features/emprestimos/schemas/emprestimo-schema';
import { createDevolucaoServer } from '@/features/emprestimos/server/emprestimos-api';
import { listEmprestimosServer } from '@/features/emprestimos/server/emprestimos-list-api';

async function submitDevolucao(values: DevolucaoPayload): Promise<void> {
  'use server';

  await createDevolucaoServer(values);
}

type DevolucaoRoutePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DevolucaoRoutePage({ searchParams }: DevolucaoRoutePageProps) {
  const rawSearchParams = searchParams ? await searchParams : undefined;
  const query = devolucoesListQuerySchema.parse({
    page: rawSearchParams?.page,
    search: rawSearchParams?.search,
    status: 'returned',
  });
  const list = await listEmprestimosServer(query);

  return <DevolucaoPage onSubmit={submitDevolucao} list={list} query={query} />;
}
