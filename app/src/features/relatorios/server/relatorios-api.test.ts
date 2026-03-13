import type { RelatorioFiltrosPayload } from "../schemas/relatorio-filtros-schema";

async function loadModule() {
  return import("./relatorios-api");
}

function mockCookies(value: string) {
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      toString: () => value,
    }),
  }));
}

function mockFetchJson(payload: unknown, ok = true): Response {
  return {
    ok,
    json: async () => payload,
  } as Response;
}

describe("getRelatorioResultado", () => {
  const filtros: RelatorioFiltrosPayload = {
    status: "",
    periodoInicio: "",
    periodoFim: "",
    usuario: "",
    hardware: "",
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("usa emprestimo ativo para dados de usuario no status atual", async () => {
    mockCookies("tenant=1");

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/hardwares")) {
        return mockFetchJson([
          {
            id: "hw-1",
            descricao: "Notebook",
            codigoPatrimonio: "PAT-1",
            funcionando: true,
            livre: false,
          },
        ]);
      }

      return mockFetchJson([
        {
          id: "loan-active",
          usuarioId: "user-active",
          hardwareId: "hw-1",
          dataRetirada: "2026-03-01T10:00:00.000Z",
          dataDevolucao: null,
        },
        {
          id: "loan-closed-newer",
          usuarioId: "user-newer-closed",
          hardwareId: "hw-1",
          dataRetirada: "2026-03-10T10:00:00.000Z",
          dataDevolucao: "2026-03-11T10:00:00.000Z",
        },
      ]);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { getRelatorioResultado } = await loadModule();
    const result = await getRelatorioResultado(filtros);

    expect(result.total).toBe(1);
    expect(result.linhas[0]?.status).toBe("emprestado");
    expect(result.linhas[0]?.usuarioId).toBe("user-active");
    expect(result.linhas[0]?.dataDevolucao).toBeNull();
  });

  it("falha quando endpoint de emprestimos falha", async () => {
    mockCookies("tenant=1");

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/hardwares")) {
        return mockFetchJson([]);
      }

      return mockFetchJson({ message: "erro" }, false);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { getRelatorioResultado } = await loadModule();

    await expect(getRelatorioResultado(filtros)).rejects.toThrow("erro");
  });
});

describe("parseRelatorioFiltros", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("retorna valores vindos da query string", async () => {
    const { parseRelatorioFiltros } = await loadModule();

    const filtros = parseRelatorioFiltros({
      status: "disponivel",
      periodoInicio: "2026-01-01",
      periodoFim: "2026-01-31",
      usuario: "ana",
      hardware: "dell",
    });

    expect(filtros).toEqual({
      status: "disponivel",
      periodoInicio: "2026-01-01",
      periodoFim: "2026-01-31",
      usuario: "ana",
      hardware: "dell",
    });
  });
});
