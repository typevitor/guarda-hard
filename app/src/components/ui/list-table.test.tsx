// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { ListTable } from "./list-table";

type Row = {
  id: string;
  nome: string;
};

describe("ListTable", () => {
  const columns = [
    { key: "id", header: "ID" },
    { key: "nome", header: "Nome" },
  ] as const;

  it("renders headers and rows", () => {
    const items: Row[] = [
      { id: "dep-1", nome: "Financeiro" },
      { id: "dep-2", nome: "Suporte" },
    ];

    render(<ListTable columns={columns} items={items} getRowKey={(item: Row) => item.id} />);

    expect(screen.getByRole("columnheader", { name: "ID" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "dep-1" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Financeiro" })).toBeTruthy();
  });

  it("renders empty message when items are empty", () => {
    render(
      <ListTable
        columns={columns}
        items={[]}
        getRowKey={(item: Row) => item.id}
        emptyMessage="Nenhum registro encontrado"
      />,
    );

    expect(screen.getByText("Nenhum registro encontrado")).toBeTruthy();
  });
});
