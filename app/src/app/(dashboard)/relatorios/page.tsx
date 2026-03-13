import { RelatoriosPage } from "@/features/relatorios/components/relatorios-page";
import type { RelatorioFiltrosPayload } from "@/features/relatorios/schemas/relatorio-filtros-schema";
import {
  getRelatorioResultado,
  parseRelatorioFiltros,
} from "@/features/relatorios/server/relatorios-api";

type RelatoriosRoutePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RelatoriosRoutePage({
  searchParams,
}: RelatoriosRoutePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialFiltros = parseRelatorioFiltros(resolvedSearchParams);
  const initialResultado = await getRelatorioResultado(initialFiltros);

  async function applyFiltros(
    values: RelatorioFiltrosPayload,
  ): Promise<typeof initialResultado> {
    "use server";

    return getRelatorioResultado(values);
  }

  return <RelatoriosPage initialResultado={initialResultado} onApplyFiltros={applyFiltros} />;
}
