import { DepartamentosPage } from "@/features/departamentos/components/departamentos-page";
import { departamentosListQuerySchema } from "@/features/departamentos/schemas/departamentos-list-query-schema";
import type { DepartamentoPayload } from "@/features/departamentos/schemas/departamento-schema";
import { createDepartamentoServer } from "@/features/departamentos/server/departamentos-api";
import { listDepartamentosServer } from "@/features/departamentos/server/departamentos-list-api";

async function submitDepartamento(values: DepartamentoPayload): Promise<void> {
  "use server";

  await createDepartamentoServer(values);
}

type DepartamentosRoutePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DepartamentosRoutePage({ searchParams }: DepartamentosRoutePageProps) {
  const rawSearchParams = searchParams ? await searchParams : undefined;
  const query = departamentosListQuerySchema.parse({
    page: rawSearchParams?.page,
    search: rawSearchParams?.search,
  });
  const list = await listDepartamentosServer(query);

  return <DepartamentosPage onSubmit={submitDepartamento} list={list} query={query} />;
}
