// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Modal } from "./modal";

describe("Modal", () => {
  it("renders dialog content when open", () => {
    const onOpenChange = vi.fn();

    render(
      <Modal open onOpenChange={onOpenChange} title="Novo registro">
        <p>Conteudo do modal</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog", { name: "Novo registro" })).toBeTruthy();
    expect(screen.getByText("Conteudo do modal")).toBeTruthy();
  });

  it("calls onOpenChange(false) when close button is clicked", () => {
    const onOpenChange = vi.fn();

    render(
      <Modal open onOpenChange={onOpenChange} title="Novo registro">
        <p>Conteudo</p>
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
