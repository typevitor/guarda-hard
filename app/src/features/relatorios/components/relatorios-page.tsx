"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RelatorioFiltrosForm } from "../forms/relatorio-filtros-form";
import type { RelatorioFiltrosPayload } from "../schemas/relatorio-filtros-schema";
import type { RelatorioResultado } from "../server/relatorios-api";

type RelatoriosPageProps = {
  initialResultado: RelatorioResultado;
  onApplyFiltros: (values: RelatorioFiltrosPayload) => Promise<RelatorioResultado>;
};

export function RelatoriosPage({
  initialResultado,
  onApplyFiltros,
}: RelatoriosPageProps) {
  const router = useRouter();
  const [resultado, setResultado] = useState<RelatorioResultado>(initialResultado);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleApplyFiltros = async (
    values: RelatorioFiltrosPayload,
    queryString: string,
  ): Promise<void> => {
    setStatus(null);

    try {
      const data = await onApplyFiltros(values);
      setResultado(data);
      router.replace(queryString ? `/relatorios?${queryString}` : "/relatorios");
      setStatus({
        type: "success",
        message: `Relatorio atualizado (${data.total} registros)`,
      });
    } catch {
      setStatus({ type: "error", message: "Nao foi possivel carregar relatorio" });
      throw new Error("submit failed");
    }
  };

  return (
    <section className="panel-card" aria-label="Pagina de relatorios">
      <h2 className="panel-title">Relatorios</h2>
      <p className="panel-text">Filtre por status, periodo, usuario e hardware.</p>

      <RelatorioFiltrosForm
        initialValues={resultado.filtros}
        onSubmit={handleApplyFiltros}
      />
      {status ? <p role="status">{status.message}</p> : null}

      <div className="panel-text">
        Query: <code>{resultado.queryString || "(sem filtros)"}</code>
      </div>

      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th scope="col">Hardware</th>
              <th scope="col">Patrimonio</th>
              <th scope="col">Status</th>
              <th scope="col">Usuario</th>
              <th scope="col">Retirada</th>
              <th scope="col">Devolucao</th>
            </tr>
          </thead>
          <tbody>
            {resultado.linhas.length === 0 ? (
              <tr>
                <td colSpan={6}>Nenhum resultado encontrado</td>
              </tr>
            ) : (
              resultado.linhas.map((linha) => (
                <tr key={linha.hardwareId}>
                  <td>{linha.descricao}</td>
                  <td>{linha.codigoPatrimonio}</td>
                  <td>{linha.status}</td>
                  <td>{linha.usuarioId ?? "-"}</td>
                  <td>{linha.dataRetirada ?? "-"}</td>
                  <td>{linha.dataDevolucao ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
