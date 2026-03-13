import { ListTable } from "@/components/ui/list-table";

import type { UsuarioListItem } from "../server/usuarios-list-api";

type UsuariosListProps = {
  items: UsuarioListItem[];
};

export function UsuariosList({ items }: UsuariosListProps) {
  return (
    <ListTable
      columns={[
        { key: "nome", header: "Nome" },
        { key: "email", header: "Email" },
        { key: "ativo", header: "Ativo", render: (item) => (item.ativo ? "Sim" : "Nao") },
      ]}
      items={items}
      getRowKey={(item) => item.id}
      emptyMessage="Nenhum usuario encontrado"
    />
  );
}
