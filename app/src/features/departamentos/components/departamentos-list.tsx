import { ListTable } from "@/components/ui/list-table";

import type { DepartamentoListItem } from "../server/departamentos-list-api";

type DepartamentosListProps = {
  items: DepartamentoListItem[];
};

export function DepartamentosList({ items }: DepartamentosListProps) {
  return (
    <ListTable
      columns={[
        { key: "nome", header: "Nome" },
        { key: "createdAt", header: "Criado em" },
      ]}
      items={items}
      getRowKey={(item) => item.id}
      emptyMessage="Nenhum departamento encontrado"
    />
  );
}
