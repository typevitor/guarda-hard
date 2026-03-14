// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CompanySelectionForm } from "./company-selection-form";

describe("CompanySelectionForm", () => {
  const empresas = [
    { id: "11111111-1111-1111-1111-111111111111", nome: "Empresa A" },
    { id: "22222222-2222-2222-2222-222222222222", nome: "Empresa B" },
  ];

  it("renders only allowed companies from minhas-empresas", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CompanySelectionForm empresas={empresas} onSubmit={onSubmit} />);

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(screen.getByRole("option", { name: "Empresa A" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Empresa B" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Empresa C" })).toBeNull();
  });

  it("submits selected empresaId to select-empresa", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CompanySelectionForm empresas={empresas} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Empresa"), {
      target: { value: "22222222-2222-2222-2222-222222222222" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        empresaId: "22222222-2222-2222-2222-222222222222",
      });
    });
  });

  it("shows top-level error and preserves selection when select-empresa fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Nao foi possivel selecionar empresa"));

    render(<CompanySelectionForm empresas={empresas} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Empresa"), {
      target: { value: "11111111-1111-1111-1111-111111111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Nao foi possivel selecionar empresa",
    );
    expect((screen.getByLabelText("Empresa") as HTMLSelectElement).value).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
  });
});
