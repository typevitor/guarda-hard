import { RelatoriosPage } from "@/features/relatorios/components/relatorios-page";
import type { RelatorioFiltrosPayload } from "@/features/relatorios/schemas/relatorio-filtros-schema";
import {
  getHistoricoResultado,
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
  const [initialResultado, initialHistorico] = await Promise.all([
    getRelatorioResultado(initialFiltros),
    getHistoricoResultado(initialFiltros),
  ]);

  async function applyFiltros(
    values: RelatorioFiltrosPayload,
  ): Promise<typeof initialResultado> {
    "use server";

    return getRelatorioResultado(values);
  }

  async function applyHistoricoFiltros(
    values: RelatorioFiltrosPayload,
  ): Promise<typeof initialHistorico> {
    "use server";

    return getHistoricoResultado(values);
  }

  return (
    <RelatoriosPage
      initialResultado={initialResultado}
      initialHistorico={initialHistorico}
      onApplyFiltros={applyFiltros}
      onApplyHistoricoFiltros={applyHistoricoFiltros}
    />
  );
}
