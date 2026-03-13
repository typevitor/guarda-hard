// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { EmprestimoForm } from "./emprestimo-form";

describe("EmprestimoForm", () => {
  it("validates required usuarioId before submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EmprestimoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Hardware"), {
      target: { value: "hardware-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar emprestimo" }));

    expect(await screen.findByText("Usuario e obrigatorio")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates required hardwareId before submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EmprestimoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Usuario"), {
      target: { value: "usuario-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar emprestimo" }));

    expect(await screen.findByText("Hardware e obrigatorio")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits payload when form is valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EmprestimoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Usuario"), {
      target: { value: "usuario-1" },
    });
    fireEvent.change(screen.getByLabelText("Hardware"), {
      target: { value: "hardware-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar emprestimo" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        usuarioId: "usuario-1",
        hardwareId: "hardware-1",
      });
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText("Usuario") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Hardware") as HTMLInputElement).value).toBe("");
  });
});
