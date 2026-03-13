// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { DevolucaoForm } from "./devolucao-form";

describe("DevolucaoForm", () => {
  it("validates required emprestimoId before submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<DevolucaoForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Registrar devolucao" }));

    expect(await screen.findByText("Emprestimo e obrigatorio")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits payload when form is valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<DevolucaoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Emprestimo"), {
      target: { value: "emprestimo-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar devolucao" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ emprestimoId: "emprestimo-1" });
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText("Emprestimo") as HTMLInputElement).value).toBe("");
  });
});
