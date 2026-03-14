// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  it("validates required email before submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "super-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Email invalido")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits only email and senha", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "super-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "ana@example.com",
        senha: "super-secret",
      });
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows top-level error and keeps input values on backend failure", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Credenciais invalidas"));

    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "super-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Credenciais invalidas");
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ana@example.com");
    expect((screen.getByLabelText("Senha") as HTMLInputElement).value).toBe("super-secret");
  });
});
