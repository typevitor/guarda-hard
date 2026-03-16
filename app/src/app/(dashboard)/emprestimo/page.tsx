import { EmprestimoPage } from "@/features/emprestimos/components/emprestimo-page";
import { emprestimosListQuerySchema } from "@/features/emprestimos/schemas/emprestimos-list-query-schema";
import type { EmprestimoPayload } from "@/features/emprestimos/schemas/emprestimo-schema";
import { createEmprestimoServer } from "@/features/emprestimos/server/emprestimos-api";
import { listEmprestimosServer } from "@/features/emprestimos/server/emprestimos-list-api";
import {
  type HardwareOption,
  listHardwareOptionsServer,
} from "@/features/hardwares/server/hardwares-options-api";
import {
  type UsuarioOption,
  listUsuarioOptionsServer,
} from "@/features/usuarios/server/usuarios-options-api";
import { ApiError } from "@/lib/api/errors";

type OptionsResult<T> = {
  options: T[];
  error: string | null;
};

async function loadUsuarioOptions(): Promise<OptionsResult<UsuarioOption>> {
  try {
    return {
      options: await listUsuarioOptionsServer(),
      error: null,
    };
  } catch (error) {
    return {
      options: [],
      error:
        error instanceof ApiError && error.message.trim().length > 0
          ? error.message
          : "Nao foi possivel carregar usuarios",
    };
  }
}

async function loadHardwareOptions(): Promise<OptionsResult<HardwareOption>> {
  try {
    return {
      options: await listHardwareOptionsServer(),
      error: null,
    };
  } catch (error) {
    return {
      options: [],
      error:
        error instanceof ApiError && error.message.trim().length > 0
          ? error.message
          : "Nao foi possivel carregar hardwares disponiveis",
    };
  }
}

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
  const [list, usuarioOptionsResult, hardwareOptionsResult] = await Promise.all([
    listEmprestimosServer(query),
    loadUsuarioOptions(),
    loadHardwareOptions(),
  ]);

  return (
    <EmprestimoPage
      onSubmit={submitEmprestimo}
      list={list}
      query={query}
      usuarioOptions={usuarioOptionsResult.options}
      hardwareOptions={hardwareOptionsResult.options}
      usuarioOptionsError={usuarioOptionsResult.error}
      hardwareOptionsError={hardwareOptionsResult.error}
    />
  );
}
