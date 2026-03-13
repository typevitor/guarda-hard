// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { DevolucaoForm } from "./devolucao-form";

describe("DevolucaoForm", () => {
  it("keeps submit disabled until an open emprestimo is selected", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const loadOptions = vi.fn().mockResolvedValue({
      items: [{ value: "emp-1", label: "emp-1 - usuario user-1 - hardware hw-1" }],
      page: 1,
      totalPages: 1,
    });

    render(<DevolucaoForm onSubmit={onSubmit} loadOptions={loadOptions} />);

    await screen.findByRole("option", { name: "emp-1 - usuario user-1 - hardware hw-1" });
    expect(screen.getByRole("button", { name: "Registrar devolucao" }).hasAttribute("disabled")).toBe(
      true,
    );

    fireEvent.change(screen.getByLabelText("Emprestimo"), {
      target: { value: "emp-1" },
    });

    expect(screen.getByRole("button", { name: "Registrar devolucao" }).hasAttribute("disabled")).toBe(
      false,
    );
  });

  it("submits selected emprestimo id", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const loadOptions = vi.fn().mockResolvedValue({
      items: [{ value: "emprestimo-1", label: "emprestimo-1 - usuario user-1 - hardware hw-1" }],
      page: 1,
      totalPages: 1,
    });

    render(<DevolucaoForm onSubmit={onSubmit} loadOptions={loadOptions} />);

    await screen.findByRole("option", {
      name: "emprestimo-1 - usuario user-1 - hardware hw-1",
    });
    fireEvent.change(screen.getByLabelText("Emprestimo"), {
      target: { value: "emprestimo-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar devolucao" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ emprestimoId: "emprestimo-1" });
    });
  });

  it("loads additional pages and keeps selected value when submit fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("network"));
    const loadOptions = vi
      .fn()
      .mockResolvedValueOnce({
        items: [{ value: "emp-1", label: "emp-1 - usuario user-1 - hardware hw-1" }],
        page: 1,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [{ value: "emp-2", label: "emp-2 - usuario user-2 - hardware hw-2" }],
        page: 2,
        totalPages: 2,
      });

    render(<DevolucaoForm onSubmit={onSubmit} loadOptions={loadOptions} />);

    await screen.findByRole("option", { name: "emp-1 - usuario user-1 - hardware hw-1" });
    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    await screen.findByRole("option", { name: "emp-2 - usuario user-2 - hardware hw-2" });

    fireEvent.change(screen.getByLabelText("Emprestimo"), {
      target: { value: "emp-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar devolucao" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ emprestimoId: "emp-2" });
    });
    expect((screen.getByLabelText("Emprestimo") as HTMLSelectElement).value).toBe("emp-2");
  });
});
