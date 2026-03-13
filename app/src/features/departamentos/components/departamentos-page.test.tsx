// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { DepartamentosPage } from "./departamentos-page";

describe("DepartamentosPage", () => {
  it("shows success feedback after successful submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<DepartamentosPage onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Financeiro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar departamento" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ nome: "Financeiro" });
    });
    expect(await screen.findByText("Departamento criado com sucesso")).toBeTruthy();
  });

  it("shows error feedback and clears stale success on failure", async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("network"));

    render(<DepartamentosPage onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Financeiro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar departamento" }));
    expect(await screen.findByText("Departamento criado com sucesso")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Juridico" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar departamento" }));

    expect(await screen.findByText("Nao foi possivel criar departamento")).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText("Departamento criado com sucesso")).toBeNull();
    });
  });
});
