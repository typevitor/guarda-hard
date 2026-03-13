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
      if (url.includes("/relatorios/hardwares")) {
        return mockFetchJson([
          {
            hardwareId: "hw-1",
            descricao: "Notebook",
            codigoPatrimonio: "PAT-1",
            status: "emprestado",
            usuarioId: "user-active",
            dataRetirada: "2026-03-01",
            dataDevolucao: null,
          },
        ]);
      }

      return mockFetchJson([]);
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

    const fetchMock = vi.fn(async () => mockFetchJson({ message: "erro" }, false));

    vi.stubGlobal("fetch", fetchMock);

    const { getRelatorioResultado } = await loadModule();

    await expect(getRelatorioResultado(filtros)).rejects.toThrow("erro");
  });

  it("aplica filtros locais de hardware, usuario e periodo apos consumir endpoint", async () => {
    mockCookies("tenant=1");

    const fetchMock = vi.fn(async () =>
      mockFetchJson([
        {
          hardwareId: "hw-1",
          descricao: "Notebook Dell",
          codigoPatrimonio: "PAT-1",
          status: "emprestado",
          usuarioId: "ana-1",
          dataRetirada: "2026-03-05",
          dataDevolucao: null,
        },
        {
          hardwareId: "hw-2",
          descricao: "Desktop",
          codigoPatrimonio: "PAT-2",
          status: "disponivel",
          usuarioId: null,
          dataRetirada: null,
          dataDevolucao: null,
        },
      ]),
    );

    vi.stubGlobal("fetch", fetchMock);

    const { getRelatorioResultado } = await loadModule();

    const result = await getRelatorioResultado({
      status: "",
      periodoInicio: "2026-03-01",
      periodoFim: "2026-03-10",
      usuario: "ana",
      hardware: "dell",
    });

    expect(result.total).toBe(1);
    expect(result.linhas[0]?.hardwareId).toBe("hw-1");
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

describe("historico/csv helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("carrega historico com filtros", async () => {
    mockCookies("tenant=1");
    const fetchMock = vi.fn(async () =>
      mockFetchJson({
        total: 1,
        linhas: [
          {
            emprestimoId: "loan-1",
            hardwareId: "hw-1",
            descricao: "Notebook",
            codigoPatrimonio: "PAT-1",
            status: "emprestado",
            usuarioId: "ana",
            dataRetirada: "2026-03-01",
            dataDevolucao: null,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getHistoricoResultado } = await loadModule();
    const result = await getHistoricoResultado({
      status: "",
      periodoInicio: "2026-03-01",
      periodoFim: "2026-03-31",
      usuario: "ana",
      hardware: "dell",
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(result.total).toBe(1);
    expect(result.linhas[0]?.emprestimoId).toBe("loan-1");
  });

  it("gera URL de exportacao csv com filtros atuais", async () => {
    const { buildHistoricoCsvUrl } = await loadModule();

    const url = buildHistoricoCsvUrl({
      status: "emprestado",
      periodoInicio: "2026-03-01",
      periodoFim: "2026-03-31",
      usuario: "ana",
      hardware: "dell",
    });

    expect(url).toBe(
      "/relatorios/emprestimos/export.csv?status=emprestado&periodoInicio=2026-03-01&periodoFim=2026-03-31&usuario=ana&hardware=dell",
    );
  });
});
