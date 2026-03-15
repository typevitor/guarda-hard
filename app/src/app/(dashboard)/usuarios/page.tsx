import { ApiError } from "@/lib/api/errors";
import { listDepartamentoOptionsServer } from "@/features/departamentos/server/departamentos-options-api";
import { UsuariosPage } from "@/features/usuarios/components/usuarios-page";
import { usuariosListQuerySchema } from "@/features/usuarios/schemas/usuarios-list-query-schema";
import type { UsuarioPayload } from "@/features/usuarios/schemas/usuario-schema";
import { createUsuarioServer } from "@/features/usuarios/server/usuarios-api";
import { listUsuariosServer } from "@/features/usuarios/server/usuarios-list-api";

async function submitUsuario(values: UsuarioPayload): Promise<void> {
  "use server";

  await createUsuarioServer(values);
}

type UsuariosRoutePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsuariosRoutePage({ searchParams }: UsuariosRoutePageProps) {
  const rawSearchParams = searchParams ? await searchParams : undefined;
  const query = usuariosListQuerySchema.parse({
    page: rawSearchParams?.page,
    search: rawSearchParams?.search,
  });

  const [list, departamentoOptionsResult] = await Promise.all([
    listUsuariosServer(query),
    listDepartamentoOptionsServer()
      .then((options) => ({ options, error: null as string | null }))
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          return { options: [], error: error.message };
        }

        return { options: [], error: "Nao foi possivel carregar departamentos" };
      }),
  ]);

  return (
    <UsuariosPage
      onSubmit={submitUsuario}
      list={list}
      query={query}
      departamentoOptions={departamentoOptionsResult.options}
      departamentoOptionsError={departamentoOptionsResult.error}
    />
  );
}
