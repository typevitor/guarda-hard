// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { HardwareForm } from "./hardware-form";

describe("HardwareForm", () => {
  it("validates required descricao before submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<HardwareForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Codigo patrimonio"), {
      target: { value: "PAT-001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar hardware" }));

    expect(await screen.findByText("Descricao e obrigatoria")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates required codigoPatrimonio before submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<HardwareForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Descricao"), {
      target: { value: "Notebook Dell" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar hardware" }));

    expect(await screen.findByText("Codigo patrimonio e obrigatorio")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits payload when form is valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<HardwareForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Descricao"), {
      target: { value: "Notebook Dell" },
    });
    fireEvent.change(screen.getByLabelText("Codigo patrimonio"), {
      target: { value: "PAT-001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar hardware" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        descricao: "Notebook Dell",
        codigoPatrimonio: "PAT-001",
      });
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText("Descricao") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Codigo patrimonio") as HTMLInputElement).value).toBe("");
  });
});
