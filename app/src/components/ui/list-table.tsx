import type { ReactNode } from "react";

type TableColumn<T> = {
  key: keyof T;
  header: string;
  render?: (item: T) => ReactNode;
};

type ListTableProps<T extends Record<string, unknown>> = {
  columns: readonly TableColumn<T>[];
  items: readonly T[];
  getRowKey: (item: T) => string;
  emptyMessage?: string;
};

export function ListTable<T extends Record<string, unknown>>({
  columns,
  items,
  getRowKey,
  emptyMessage = "Nenhum registro encontrado",
}: ListTableProps<T>) {
  return (
    <div className="list-table-shell">
      <table className="list-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={getRowKey(item)}>
                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {column.render ? column.render(item) : String(item[column.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
