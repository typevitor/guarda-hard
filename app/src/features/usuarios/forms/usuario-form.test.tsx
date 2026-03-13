// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { UsuarioForm } from "./usuario-form";

describe("UsuarioForm", () => {
  it("validates required nome before submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<UsuarioForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Departamento"), {
      target: { value: "dep-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar usuario" }));

    expect(await screen.findByText("Nome e obrigatorio")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates email format before submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<UsuarioForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "invalido" },
    });
    fireEvent.change(screen.getByLabelText("Departamento"), {
      target: { value: "dep-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar usuario" }));

    expect(await screen.findByText("Email invalido")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates required departamentoId before submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<UsuarioForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar usuario" }));

    expect(await screen.findByText("Departamento e obrigatorio")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits payload when form is valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<UsuarioForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Departamento"), {
      target: { value: "dep-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar usuario" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nome: "Ana",
        email: "ana@example.com",
        departamentoId: "dep-1",
      });
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Departamento") as HTMLInputElement).value).toBe("");
  });
});
