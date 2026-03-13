import { cookies } from "next/headers";

import {
  buildRelatorioQueryString,
  relatorioFiltrosDefaultValues,
  relatorioFiltrosSchema,
  type RelatorioFiltrosPayload,
} from "../schemas/relatorio-filtros-schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
  emprestimo: EmprestimoApiRow | undefined,
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

function isUsuarioMatch(emprestimo: EmprestimoApiRow | undefined, value: string): boolean {
  if (!value) {
    return true;
  }

  if (!emprestimo) {
    return false;
  }

  return emprestimo.usuarioId.toLowerCase().includes(value.toLowerCase());
}

async function fetchJson<T>(path: string, cookieHeader: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar relatorios");
  }

  return (await response.json()) as T;
}

export async function getRelatorioResultado(
  rawFiltros: RelatorioFiltrosPayload,
): Promise<RelatorioResultado> {
  const filtros = relatorioFiltrosSchema.parse(rawFiltros);
  const cookieHeader = (await cookies()).toString();

  if (!cookieHeader) {
    throw new Error("Sessao invalida para consultar relatorios");
  }

  const [hardwares, emprestimos] = await Promise.all([
    fetchJson<HardwareApiRow[]>("/hardwares", cookieHeader),
    fetchJson<EmprestimoApiRow[]>("/emprestimos", cookieHeader).catch(() => []),
  ]);

  const emprestimoPorHardware = new Map<string, EmprestimoApiRow>();

  for (const emprestimo of emprestimos) {
    const current = emprestimoPorHardware.get(emprestimo.hardwareId);

    if (!current || emprestimo.dataRetirada > current.dataRetirada) {
      emprestimoPorHardware.set(emprestimo.hardwareId, emprestimo);
    }
  }

  const linhas = hardwares
    .map((hardware) => {
      const emprestimo = emprestimoPorHardware.get(hardware.id);

      return {
        hardwareId: hardware.id,
        descricao: hardware.descricao,
        codigoPatrimonio: hardware.codigoPatrimonio,
        status: getStatus(hardware),
        usuarioId: emprestimo?.usuarioId ?? null,
        dataRetirada: emprestimo ? normalizeDate(emprestimo.dataRetirada) : null,
        dataDevolucao: emprestimo?.dataDevolucao
          ? normalizeDate(emprestimo.dataDevolucao)
          : null,
      } satisfies RelatorioLinha;
    })
    .filter((linha) => {
      const emprestimo = linha.hardwareId
        ? emprestimoPorHardware.get(linha.hardwareId)
        : undefined;

      if (filtros.status && linha.status !== filtros.status) {
        return false;
      }

      if (!isHardwareMatch({
        id: linha.hardwareId,
        descricao: linha.descricao,
        codigoPatrimonio: linha.codigoPatrimonio,
        funcionando: linha.status !== "defeituoso",
        livre: linha.status === "disponivel",
      }, filtros.hardware)) {
        return false;
      }

      if (!isUsuarioMatch(emprestimo, filtros.usuario)) {
        return false;
      }

      return isWithinPeriodo(emprestimo, filtros.periodoInicio, filtros.periodoFim);
    });

  return {
    queryString: buildRelatorioQueryString(filtros),
    filtros,
    total: linhas.length,
    linhas,
  };
}
