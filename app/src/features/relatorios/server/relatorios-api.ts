import { apiClient } from "@/lib/api/client";

import {
  buildRelatorioQueryString,
  relatorioFiltrosDefaultValues,
  relatorioFiltrosSchema,
  type RelatorioFiltrosPayload,
} from "../schemas/relatorio-filtros-schema";

type HardwareApiRow = {
  id: string;
  descricao: string;
  codigoPatrimonio: string;
  funcionando: boolean;
  livre: boolean;
};

type EmprestimoApiRow = {
  id: string;
  usuarioId: string;
  hardwareId: string;
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

type HardwareRelatorioContext = {
  row: HardwareApiRow;
  activeEmprestimo: EmprestimoApiRow | null;
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

function getStatus(hardware: HardwareApiRow): RelatorioStatus {
  if (!hardware.funcionando) {
    return "defeituoso";
  }

  if (hardware.livre) {
    return "disponivel";
  }

  return "emprestado";
}

function normalizeDate(value: string): string {
  return value.slice(0, 10);
}

function isWithinPeriodo(
  emprestimo: EmprestimoApiRow | null,
  periodoInicio: string,
  periodoFim: string,
): boolean {
  if (!periodoInicio && !periodoFim) {
    return true;
  }

  if (!emprestimo) {
    return false;
  }

  const retirada = normalizeDate(emprestimo.dataRetirada);

  if (periodoInicio && retirada < periodoInicio) {
    return false;
  }

  if (periodoFim && retirada > periodoFim) {
    return false;
  }

  return true;
}

function isHardwareMatch(hardware: HardwareApiRow, value: string): boolean {
  if (!value) {
    return true;
  }

  const term = value.toLowerCase();
  return (
    hardware.id.toLowerCase().includes(term) ||
    hardware.descricao.toLowerCase().includes(term) ||
    hardware.codigoPatrimonio.toLowerCase().includes(term)
  );
}

function isUsuarioMatch(emprestimo: EmprestimoApiRow | null, value: string): boolean {
  if (!value) {
    return true;
  }

  if (!emprestimo) {
    return false;
  }

  return emprestimo.usuarioId.toLowerCase().includes(value.toLowerCase());
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

  const [hardwares, emprestimos] = await Promise.all([
    fetchJson<HardwareApiRow[]>("/hardwares"),
    fetchJson<EmprestimoApiRow[]>("/emprestimos"),
  ]);

  const activeEmprestimoPorHardware = new Map<string, EmprestimoApiRow>();

  for (const emprestimo of emprestimos) {
    if (emprestimo.dataDevolucao !== null) {
      continue;
    }

    const current = activeEmprestimoPorHardware.get(emprestimo.hardwareId);

    if (!current || emprestimo.dataRetirada > current.dataRetirada) {
      activeEmprestimoPorHardware.set(emprestimo.hardwareId, emprestimo);
    }
  }

  const hardwareContexts: HardwareRelatorioContext[] = hardwares.map((row) => ({
    row,
    activeEmprestimo: activeEmprestimoPorHardware.get(row.id) ?? null,
  }));

  const linhas = hardwareContexts
    .filter(({ row, activeEmprestimo }) => {
      const status = getStatus(row);

      if (filtros.status && status !== filtros.status) {
        return false;
      }

      if (!isHardwareMatch(row, filtros.hardware)) {
        return false;
      }

      if (!isUsuarioMatch(activeEmprestimo, filtros.usuario)) {
        return false;
      }

      return isWithinPeriodo(activeEmprestimo, filtros.periodoInicio, filtros.periodoFim);
    })
    .map(({ row, activeEmprestimo }) => {
      const status = getStatus(row);

      return {
        hardwareId: row.id,
        descricao: row.descricao,
        codigoPatrimonio: row.codigoPatrimonio,
        status,
        usuarioId: activeEmprestimo?.usuarioId ?? null,
        dataRetirada: activeEmprestimo ? normalizeDate(activeEmprestimo.dataRetirada) : null,
        dataDevolucao: null,
      } satisfies RelatorioLinha;
    });

  return {
    queryString: buildRelatorioQueryString(filtros),
    filtros,
    total: linhas.length,
    linhas,
  };
}
