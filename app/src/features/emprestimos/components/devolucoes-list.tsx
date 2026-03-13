import { ListTable } from "@/components/ui/list-table";

import type { EmprestimoListItem } from "../server/emprestimos-list-api";

type DevolucoesListProps = {
  items: EmprestimoListItem[];
};

export function DevolucoesList({ items }: DevolucoesListProps) {
  return (
    <ListTable
      columns={[
        { key: "usuarioId", header: "Usuario" },
        { key: "hardwareId", header: "Hardware" },
        { key: "dataDevolucao", header: "Devolucao" },
      ]}
      items={items}
      getRowKey={(item) => item.id}
      emptyMessage="Nenhuma devolucao registrada"
    />
  );
}
