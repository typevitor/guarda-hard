// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RegisterForm } from "./register-form";

describe("RegisterForm", () => {
  const empresas = [
    { id: "11111111-1111-1111-1111-111111111111", nome: "Empresa A" },
    { id: "22222222-2222-2222-2222-222222222222", nome: "Empresa B" },
  ];

  it("validates that empresaId must be one of fetched options", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<RegisterForm empresas={empresas} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "super-secret" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), {
      target: { value: "super-secret" },
    });
    fireEvent.change(screen.getByLabelText("Empresa"), {
      target: { value: "33333333-3333-3333-3333-333333333333" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByText("Selecione uma empresa valida")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits required register payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<RegisterForm empresas={empresas} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "super-secret" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), {
      target: { value: "super-secret" },
    });
    fireEvent.change(screen.getByLabelText("Empresa"), {
      target: { value: "22222222-2222-2222-2222-222222222222" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nome: "Ana",
        email: "ana@example.com",
        senha: "super-secret",
        confirmarSenha: "super-secret",
        empresaId: "22222222-2222-2222-2222-222222222222",
      });
    });
  });

  it("shows top-level error and keeps values on backend failure", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Nao foi possivel registrar"));

    render(<RegisterForm empresas={empresas} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "super-secret" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), {
      target: { value: "super-secret" },
    });
    fireEvent.change(screen.getByLabelText("Empresa"), {
      target: { value: "11111111-1111-1111-1111-111111111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Nao foi possivel registrar");
    expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Ana");
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ana@example.com");
    expect((screen.getByLabelText("Senha") as HTMLInputElement).value).toBe("super-secret");
    expect((screen.getByLabelText("Confirmar senha") as HTMLInputElement).value).toBe(
      "super-secret",
    );
    expect((screen.getByLabelText("Empresa") as HTMLSelectElement).value).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
  });
});
