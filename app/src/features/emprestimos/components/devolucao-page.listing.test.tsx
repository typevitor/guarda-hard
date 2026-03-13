// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
  usePathname: () => "/devolucao",
}));
import { DevolucaoPage } from "./devolucao-page";

describe("DevolucaoPage listing flow", () => {
  const baseList = {
    items: [
      {
        id: "emp-r-1",
        empresaId: "emp-1",
        usuarioId: "user-1",
        hardwareId: "hw-1",
        dataRetirada: "2026-03-01",
        dataDevolucao: "2026-03-05",
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
    status: "returned" as const,
    usuarioId: "",
    hardwareId: "",
    retiradaFrom: undefined,
    retiradaTo: undefined,
    devolucaoFrom: undefined,
    devolucaoTo: undefined,
  };

  const loadOptionsMock = vi.fn();

  beforeEach(() => {
    refreshMock.mockReset();
    pushMock.mockReset();
    loadOptionsMock.mockReset();
  });

  it("requires selecting open emprestimo before enabling submit", async () => {
    loadOptionsMock.mockResolvedValue({
      items: [{ value: "emp-1", label: "emp-1 - usuario user-1 - hardware hw-1" }],
      page: 1,
      totalPages: 1,
    });

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <DevolucaoPage
        onSubmit={onSubmit}
        onLoadOpenEmprestimos={loadOptionsMock}
        list={baseList}
        query={baseQuery}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    await screen.findByRole("option", { name: "emp-1 - usuario user-1 - hardware hw-1" });

    expect(screen.getByRole("button", { name: "Registrar devolucao" }).hasAttribute("disabled")).toBe(
      true,
    );

    fireEvent.change(screen.getByLabelText("Emprestimo"), { target: { value: "emp-1" } });
    expect(screen.getByRole("button", { name: "Registrar devolucao" }).hasAttribute("disabled")).toBe(
      false,
    );
  });

  it("submits selected id to devolucao endpoint path contract", async () => {
    loadOptionsMock.mockResolvedValue({
      items: [{ value: "emp-2", label: "emp-2 - usuario user-2 - hardware hw-2" }],
      page: 1,
      totalPages: 1,
    });

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <DevolucaoPage
        onSubmit={onSubmit}
        onLoadOpenEmprestimos={loadOptionsMock}
        list={baseList}
        query={baseQuery}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    await screen.findByRole("option", { name: "emp-2 - usuario user-2 - hardware hw-2" });
    fireEvent.change(screen.getByLabelText("Emprestimo"), { target: { value: "emp-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar devolucao" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ emprestimoId: "emp-2" });
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("shows stale-id error while keeping modal open", async () => {
    loadOptionsMock.mockResolvedValue({
      items: [{ value: "emp-3", label: "emp-3 - usuario user-3 - hardware hw-3" }],
      page: 1,
      totalPages: 1,
    });

    const onSubmit = vi.fn().mockRejectedValue(new Error("stale"));
    render(
      <DevolucaoPage
        onSubmit={onSubmit}
        onLoadOpenEmprestimos={loadOptionsMock}
        list={baseList}
        query={baseQuery}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    await screen.findByRole("option", { name: "emp-3 - usuario user-3 - hardware hw-3" });
    fireEvent.change(screen.getByLabelText("Emprestimo"), { target: { value: "emp-3" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar devolucao" }));

    expect(await screen.findByText("Nao foi possivel registrar devolucao")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Nova devolucao" })).toBeTruthy();
  });

  it("supports loading additional selector pages", async () => {
    loadOptionsMock
      .mockResolvedValueOnce({
        items: [{ value: "emp-4", label: "emp-4 - usuario user-4 - hardware hw-4" }],
        page: 1,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [{ value: "emp-5", label: "emp-5 - usuario user-5 - hardware hw-5" }],
        page: 2,
        totalPages: 2,
      });

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <DevolucaoPage
        onSubmit={onSubmit}
        onLoadOpenEmprestimos={loadOptionsMock}
        list={baseList}
        query={baseQuery}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    await screen.findByRole("option", { name: "emp-4 - usuario user-4 - hardware hw-4" });
    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    await screen.findByRole("option", { name: "emp-5 - usuario user-5 - hardware hw-5" });
    expect(loadOptionsMock).toHaveBeenNthCalledWith(2, 2, undefined);
  });

  it("disables submit and shows empty-state when no open emprestimos", async () => {
    loadOptionsMock.mockResolvedValue({
      items: [],
      page: 1,
      totalPages: 1,
    });

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <DevolucaoPage
        onSubmit={onSubmit}
        onLoadOpenEmprestimos={loadOptionsMock}
        list={baseList}
        query={baseQuery}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    expect(await screen.findByText("Nao ha emprestimos em aberto para devolucao.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Registrar devolucao" }).hasAttribute("disabled")).toBe(
      true,
    );
  });
});
