// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RelatoriosPage } from "./relatorios-page";
import type {
  RelatorioHistoricoResultado,
  RelatorioResultado,
} from "../server/relatorios-api";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

const baseResultado: RelatorioResultado = {
  queryString: "",
  filtros: {
    status: "",
    periodoInicio: "",
    periodoFim: "",
    usuario: "",
    hardware: "",
  },
  total: 0,
  linhas: [],
};

const baseHistorico: RelatorioHistoricoResultado = {
  queryString: "",
  filtros: {
    status: "",
    periodoInicio: "",
    periodoFim: "",
    usuario: "",
    hardware: "",
  },
  total: 0,
  linhas: [],
};

describe("RelatoriosPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it("aplica filtros, atualiza URL e mostra retorno da consulta", async () => {
    const onApplyFiltros = vi.fn().mockResolvedValue({
      queryString: "status=emprestado",
      filtros: {
        status: "emprestado",
        periodoInicio: "",
        periodoFim: "",
        usuario: "",
        hardware: "",
      },
      total: 1,
      linhas: [
        {
          hardwareId: "hw-1",
          descricao: "Notebook",
          codigoPatrimonio: "PAT-1",
          status: "emprestado",
          usuarioId: "user-1",
          dataRetirada: "2026-03-01",
          dataDevolucao: null,
        },
      ],
    });

    const onApplyHistoricoFiltros = vi.fn().mockResolvedValue({
      queryString: "status=emprestado",
      filtros: {
        status: "emprestado",
        periodoInicio: "",
        periodoFim: "",
        usuario: "",
        hardware: "",
      },
      total: 1,
      linhas: [
        {
          emprestimoId: "loan-1",
          hardwareId: "hw-1",
          descricao: "Notebook",
          codigoPatrimonio: "PAT-1",
          status: "emprestado",
          usuarioId: "user-1",
          dataRetirada: "2026-03-01",
          dataDevolucao: null,
        },
      ],
    });

    render(
      <RelatoriosPage
        initialResultado={{ ...baseResultado }}
        initialHistorico={{ ...baseHistorico }}
        onApplyFiltros={onApplyFiltros}
        onApplyHistoricoFiltros={onApplyHistoricoFiltros}
      />,
    );

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "emprestado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => {
      expect(onApplyFiltros).toHaveBeenCalledWith({
        status: "emprestado",
        periodoInicio: "",
        periodoFim: "",
        usuario: "",
        hardware: "",
      });
    });

    await waitFor(() => {
      expect(onApplyHistoricoFiltros).toHaveBeenCalledWith({
        status: "emprestado",
        periodoInicio: "",
        periodoFim: "",
        usuario: "",
        hardware: "",
      });
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/relatorios?status=emprestado");
    });

    expect(
      await screen.findByText("Relatorios atualizados (situacao: 1, historico: 1)"),
    ).toBeTruthy();
    expect(screen.getAllByText("Notebook")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Exportar CSV" })).toBeTruthy();
  });
});
