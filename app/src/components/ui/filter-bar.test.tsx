// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { FilterBar } from "./filter-bar";

describe("FilterBar", () => {
  it("submits current search value", () => {
    const onSearchChange = vi.fn();

    render(
      <FilterBar
        searchValue=""
        searchPlaceholder="Buscar"
        onSearchChange={onSearchChange}
        onClearFilters={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText("Buscar"), {
      target: { value: "financeiro" },
    });

    expect(onSearchChange).toHaveBeenCalledWith("financeiro");
  });

  it("triggers clear callback", () => {
    const onClearFilters = vi.fn();

    render(
      <FilterBar
        searchValue="financeiro"
        searchPlaceholder="Buscar"
        onSearchChange={() => {}}
        onClearFilters={onClearFilters}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
