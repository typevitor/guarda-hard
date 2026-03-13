import { ListTable } from "@/components/ui/list-table";

import type { EmprestimoListItem } from "../server/emprestimos-list-api";

type EmprestimosListProps = {
  items: EmprestimoListItem[];
};

export function EmprestimosList({ items }: EmprestimosListProps) {
  return (
    <ListTable
      columns={[
        { key: "usuarioId", header: "Usuario" },
        { key: "hardwareId", header: "Hardware" },
        { key: "dataRetirada", header: "Retirada" },
      ]}
      items={items}
      getRowKey={(item) => item.id}
      emptyMessage="Nenhum emprestimo em aberto"
    />
  );
}
