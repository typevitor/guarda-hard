import { ListTable } from "@/components/ui/list-table";

import type { HardwareListItem } from "../server/hardwares-list-api";

type HardwaresListProps = {
  items: HardwareListItem[];
};

export function HardwaresList({ items }: HardwaresListProps) {
  return (
    <ListTable
      columns={[
        { key: "descricao", header: "Descricao" },
        { key: "codigoPatrimonio", header: "Patrimonio" },
        { key: "livre", header: "Livre", render: (item) => (item.livre ? "Sim" : "Nao") },
      ]}
      items={items}
      getRowKey={(item) => item.id}
      emptyMessage="Nenhum hardware encontrado"
    />
  );
}
