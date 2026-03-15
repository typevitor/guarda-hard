import { apiClient } from "@/lib/api/client";

import {
  buildRelatorioQueryString,
  relatorioFiltrosDefaultValues,
  relatorioFiltrosSchema,
  type RelatorioFiltrosPayload,
} from "../schemas/relatorio-filtros-schema";

type HardwareApiRow = {
  hardwareId: string;
  descricao: string;
  codigoPatrimonio: string;
  status: RelatorioStatus;
  usuarioId: string;
  dataRetirada: string;
  dataDevolucao: string | null;
};

export type RelatorioStatus = "disponivel" | "emprestado" | "defeituoso";

export type RelatorioLinha = {
  hardwareId: string;
  descricao: string;
  codigoPatrimonio: string;
  status: RelatorioStatus;
  usuarioId: string | null;
  dataRetirada: string | null;
  dataDevolucao: string | null;
};

export type RelatorioResultado = {
  queryString: string;
  filtros: RelatorioFiltrosPayload;
  total: number;
  linhas: RelatorioLinha[];
};

export type RelatorioHistoricoLinha = {
  emprestimoId: string;
  hardwareId: string;
  descricao: string;
  codigoPatrimonio: string;
  status: RelatorioStatus;
  usuarioId: string;
  dataRetirada: string;
  dataDevolucao: string | null;
};

export type RelatorioHistoricoResultado = {
  queryString: string;
  filtros: RelatorioFiltrosPayload;
  total: number;
  linhas: RelatorioHistoricoLinha[];
};

type RelatorioSituacaoPayload = {
  total?: unknown;
  linhas?: unknown;
};

function parseSearchValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseRelatorioFiltros(
  searchParams?: Record<string, string | string[] | undefined>,
): RelatorioFiltrosPayload {
  if (!searchParams) {
    return relatorioFiltrosDefaultValues;
  }

  return relatorioFiltrosSchema.parse({
    status: parseSearchValue(searchParams.status),
    periodoInicio: parseSearchValue(searchParams.periodoInicio),
    periodoFim: parseSearchValue(searchParams.periodoFim),
    usuario: parseSearchValue(searchParams.usuario),
    hardware: parseSearchValue(searchParams.hardware),
  });
}

function isWithinPeriodo(
  linha: HardwareApiRow,
  periodoInicio: string,
  periodoFim: string,
): boolean {
  if (!periodoInicio && !periodoFim) {
    return true;
  }

  if (!linha.dataRetirada) {
    return false;
  }

  const retirada = linha.dataRetirada;

  if (periodoInicio && retirada < periodoInicio) {
    return false;
  }

  if (periodoFim && retirada > periodoFim) {
    return false;
  }

  return true;
}

function isHardwareMatch(linha: HardwareApiRow, value: string): boolean {
  if (!value) {
    return true;
  }

  const term = value.toLowerCase();
  return (
    linha.hardwareId.toLowerCase().includes(term) ||
    linha.descricao.toLowerCase().includes(term) ||
    linha.codigoPatrimonio.toLowerCase().includes(term)
  );
}

function isUsuarioMatch(linha: HardwareApiRow, value: string): boolean {
  if (!value) {
    return true;
  }

  if (!linha.usuarioId) {
    return false;
  }

  return linha.usuarioId.toLowerCase().includes(value.toLowerCase());
}

async function fetchJson<T>(path: string): Promise<T> {
  return apiClient<T>({
    path,
    method: "GET",
    fallbackErrorMessage: "Nao foi possivel carregar relatorios",
  });
}

export async function getRelatorioResultado(
  rawFiltros: RelatorioFiltrosPayload,
): Promise<RelatorioResultado> {
  const filtros = relatorioFiltrosSchema.parse(rawFiltros);
  const statusQuery = filtros.status ? `?status=${encodeURIComponent(filtros.status)}` : "";

  const rawPayload = await fetchJson<unknown>(`/relatorios/hardwares${statusQuery}`);
  const payload: RelatorioSituacaoPayload =
    rawPayload && typeof rawPayload === "object" ? (rawPayload as RelatorioSituacaoPayload) : {};
  const linhasOriginais = Array.isArray(payload.linhas) ? (payload.linhas as HardwareApiRow[]) : [];

  const linhas = linhasOriginais
    .filter((linha) => {
      if (!isHardwareMatch(linha, filtros.hardware)) {
        return false;
      }

      if (!isUsuarioMatch(linha, filtros.usuario)) {
        return false;
      }

      return isWithinPeriodo(linha, filtros.periodoInicio, filtros.periodoFim);
    })
    .map((linha) => {
      return {
        hardwareId: linha.hardwareId,
        descricao: linha.descricao,
        codigoPatrimonio: linha.codigoPatrimonio,
        status: linha.status,
        usuarioId: linha.usuarioId,
        dataRetirada: linha.dataRetirada,
        dataDevolucao: linha.dataDevolucao,
      } satisfies RelatorioLinha;
    });

  const total =
    typeof payload.total === "number" && Number.isFinite(payload.total)
      ? payload.total
      : linhasOriginais.length;

  return {
    queryString: buildRelatorioQueryString(filtros),
    filtros,
    total,
    linhas,
  };
}

export async function getHistoricoResultado(
  rawFiltros: RelatorioFiltrosPayload,
): Promise<RelatorioHistoricoResultado> {
  const filtros = relatorioFiltrosSchema.parse(rawFiltros);
  const queryString = buildRelatorioQueryString(filtros);
  const path = queryString
    ? `/relatorios/emprestimos?${queryString}`
    : "/relatorios/emprestimos";

  const payload = await fetchJson<{ total: number; linhas: RelatorioHistoricoLinha[] }>(path);

  return {
    queryString,
    filtros,
    total: payload.total,
    linhas: payload.linhas,
  };
}

export function buildHistoricoCsvUrl(values: RelatorioFiltrosPayload): string {
  const queryString = buildRelatorioQueryString(values);
  return queryString
    ? `/relatorios/emprestimos/export.csv?${queryString}`
    : "/relatorios/emprestimos/export.csv";
}
