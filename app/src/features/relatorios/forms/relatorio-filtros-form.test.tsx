// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RelatorioFiltrosForm } from "./relatorio-filtros-form";

describe("RelatorioFiltrosForm", () => {
  it("submits status, periodo, usuario e hardware com query string", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<RelatorioFiltrosForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "emprestado" },
    });
    fireEvent.change(screen.getByLabelText("Periodo inicial"), {
      target: { value: "2026-03-01" },
    });
    fireEvent.change(screen.getByLabelText("Periodo final"), {
      target: { value: "2026-03-10" },
    });
    fireEvent.change(screen.getByLabelText("Usuario"), {
      target: { value: "ana" },
    });
    fireEvent.change(screen.getByLabelText("Hardware"), {
      target: { value: "notebook" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      {
        status: "emprestado",
        periodoInicio: "2026-03-01",
        periodoFim: "2026-03-10",
        usuario: "ana",
        hardware: "notebook",
      },
      "status=emprestado&periodoInicio=2026-03-01&periodoFim=2026-03-10&usuario=ana&hardware=notebook",
    );
  });

  it("remove campos vazios da query string", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<RelatorioFiltrosForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Hardware"), {
      target: { value: "desktop" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      {
        status: "",
        periodoInicio: "",
        periodoFim: "",
        usuario: "",
        hardware: "desktop",
      },
      "hardware=desktop",
    );
  });

  it("inicializa campos com filtros atuais", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <RelatorioFiltrosForm
        initialValues={{
          status: "defeituoso",
          periodoInicio: "2026-02-01",
          periodoFim: "2026-02-28",
          usuario: "maria",
          hardware: "dell",
        }}
        onSubmit={onSubmit}
      />,
    );

    expect((screen.getByLabelText("Status") as HTMLSelectElement).value).toBe("defeituoso");
    expect((screen.getByLabelText("Periodo inicial") as HTMLInputElement).value).toBe(
      "2026-02-01",
    );
    expect((screen.getByLabelText("Periodo final") as HTMLInputElement).value).toBe(
      "2026-02-28",
    );
    expect((screen.getByLabelText("Usuario") as HTMLInputElement).value).toBe("maria");
    expect((screen.getByLabelText("Hardware") as HTMLInputElement).value).toBe("dell");
  });
});
