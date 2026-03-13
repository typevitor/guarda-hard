import { EmprestimoPage } from "@/features/emprestimos/components/emprestimo-page";
import { emprestimosListQuerySchema } from "@/features/emprestimos/schemas/emprestimos-list-query-schema";
import type { EmprestimoPayload } from "@/features/emprestimos/schemas/emprestimo-schema";
import { createEmprestimoServer } from "@/features/emprestimos/server/emprestimos-api";
import { listEmprestimosServer } from "@/features/emprestimos/server/emprestimos-list-api";

async function submitEmprestimo(values: EmprestimoPayload): Promise<void> {
  "use server";

  await createEmprestimoServer(values);
}

type EmprestimoRoutePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmprestimoRoutePage({ searchParams }: EmprestimoRoutePageProps) {
  const rawSearchParams = searchParams ? await searchParams : undefined;
  const query = emprestimosListQuerySchema.parse({
    page: rawSearchParams?.page,
    search: rawSearchParams?.search,
    status: "open",
  });
  const list = await listEmprestimosServer(query);

  return <EmprestimoPage onSubmit={submitEmprestimo} list={list} query={query} />;
}
