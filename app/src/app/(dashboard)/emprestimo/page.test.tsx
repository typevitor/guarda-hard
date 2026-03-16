import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    listEmprestimosServer: vi.fn(),
    listUsuarioOptionsServer: vi.fn(),
    listHardwareOptionsServer: vi.fn(),
    listUsuariosServer: vi.fn(() => {
      throw new Error("listUsuariosServer should not be called by emprestimo route");
    }),
    listHardwaresServer: vi.fn(() => {
      throw new Error("listHardwaresServer should not be called by emprestimo route");
    }),
    emprestimoPageComponent: vi.fn(),
  };
});

vi.mock("@/features/emprestimos/server/emprestimos-list-api", () => ({
  listEmprestimosServer: mocks.listEmprestimosServer,
}));

vi.mock("@/features/usuarios/server/usuarios-options-api", () => ({
  listUsuarioOptionsServer: mocks.listUsuarioOptionsServer,
}));

vi.mock("@/features/hardwares/server/hardwares-options-api", () => ({
  listHardwareOptionsServer: mocks.listHardwareOptionsServer,
}));

vi.mock("@/features/usuarios/server/usuarios-list-api", () => ({
  listUsuariosServer: mocks.listUsuariosServer,
}));

vi.mock("@/features/hardwares/server/hardwares-list-api", () => ({
  listHardwaresServer: mocks.listHardwaresServer,
}));

vi.mock("@/features/emprestimos/components/emprestimo-page", () => ({
  EmprestimoPage: mocks.emprestimoPageComponent,
}));

describe("Emprestimo route page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads dedicated options endpoints and never calls paginated usuarios/hardwares clients", async () => {
    const emprestimosList = {
      items: [],
      page: 2,
      pageSize: 10 as const,
      total: 0,
      totalPages: 0,
    };
    const usuarioOptions = [{ id: "user-1", nome: "Maria" }];
    const hardwareOptions = [
      {
        id: "hw-1",
        descricao: "Notebook",
        marca: "Dell",
        modelo: "Latitude",
        codigoPatrimonio: "PAT-001",
      },
    ];

    mocks.listEmprestimosServer.mockResolvedValueOnce(emprestimosList);
    mocks.listUsuarioOptionsServer.mockResolvedValueOnce(usuarioOptions);
    mocks.listHardwareOptionsServer.mockResolvedValueOnce(hardwareOptions);

    const { default: EmprestimoRoutePage } = await import("./page");

    const routeResult = await EmprestimoRoutePage({
      searchParams: Promise.resolve({
        page: "2",
        search: "maria",
      }),
    });

    expect(mocks.listEmprestimosServer).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      search: "maria",
      status: "open",
      usuarioId: "",
      hardwareId: "",
      retiradaFrom: undefined,
      retiradaTo: undefined,
    });
    expect(mocks.listUsuarioOptionsServer).toHaveBeenCalledTimes(1);
    expect(mocks.listHardwareOptionsServer).toHaveBeenCalledTimes(1);
    expect(mocks.listUsuariosServer).not.toHaveBeenCalled();
    expect(mocks.listHardwaresServer).not.toHaveBeenCalled();

    const props = (routeResult as { type: unknown; props: unknown }).props as {
      list: unknown;
      query: unknown;
      usuarioOptions: unknown;
      hardwareOptions: unknown;
      usuarioOptionsError: unknown;
      hardwareOptionsError: unknown;
      onSubmit: unknown;
    };

    expect((routeResult as { type: unknown }).type).toBe(mocks.emprestimoPageComponent);

    expect(props.list).toEqual(emprestimosList);
    expect(props.query).toEqual({
      page: 2,
      pageSize: 10,
      search: "maria",
      status: "open",
      usuarioId: "",
      hardwareId: "",
      retiradaFrom: undefined,
      retiradaTo: undefined,
    });
    expect(props.usuarioOptions).toEqual(usuarioOptions);
    expect(props.hardwareOptions).toEqual(hardwareOptions);
    expect(props.usuarioOptionsError).toBeNull();
    expect(props.hardwareOptionsError).toBeNull();
    expect(typeof props.onSubmit).toBe("function");
  });
});
