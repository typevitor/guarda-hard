// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
  usePathname: () => "/emprestimo",
}));

import { EmprestimoPage } from "./emprestimo-page";

describe("EmprestimoPage listing flow", () => {
  const baseList = {
    items: [
      {
        id: "emp-1",
        empresaId: "emp-1",
        usuarioId: "user-1",
        hardwareId: "hw-1",
        dataRetirada: "2026-03-01",
        dataDevolucao: null,
        createdAt: "",
        updatedAt: "",
      },
    ],
    page: 2,
    pageSize: 10,
    total: 11,
    totalPages: 4,
  };

  const baseQuery = {
    page: 2,
    pageSize: 10 as const,
    search: "",
    status: "open" as const,
    usuarioId: "",
    hardwareId: "",
    retiradaFrom: undefined,
    retiradaTo: undefined,
  };

  beforeEach(() => {
    refreshMock.mockReset();
    pushMock.mockReset();
  });

  it("renders operation-specific open list and creates via modal", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EmprestimoPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    expect(screen.getByRole("cell", { name: "user-1" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "New" }));
    fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "user-2" } });
    fireEvent.change(screen.getByLabelText("Hardware"), { target: { value: "hw-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar emprestimo" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ usuarioId: "user-2", hardwareId: "hw-2" });
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("keeps modal open and preserves values on failure", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("network"));

    render(<EmprestimoPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "user-3" } });
    fireEvent.change(screen.getByLabelText("Hardware"), { target: { value: "hw-3" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar emprestimo" }));

    expect(await screen.findByText("Nao foi possivel registrar emprestimo")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Novo emprestimo" })).toBeTruthy();
    expect((screen.getByLabelText("Usuario") as HTMLInputElement).value).toBe("user-3");
  });

  it("resets page on filter and keeps filter on pagination", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EmprestimoPage
        onSubmit={onSubmit}
        list={baseList}
        query={{ ...baseQuery, search: "user" }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "new" } });
    expect(pushMock).toHaveBeenCalledWith("/emprestimo?page=1&status=open&search=new");

    fireEvent.click(screen.getByRole("button", { name: "Proxima pagina" }));
    expect(pushMock).toHaveBeenCalledWith("/emprestimo?page=2&status=open&search=new");
  });
});
