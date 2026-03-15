'use client';

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({ page, totalPages, onPageChange }: PaginationControlsProps) {
  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const safeTotalPages = Number.isFinite(totalPages) ? Math.max(1, totalPages) : 1;

  return (
    <nav className="pagination-controls" aria-label="Paginacao">
      <button type="button" onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1}>
        Anterior
      </button>
      <p className="pagination-label">
        Pagina {safePage} de {safeTotalPages}
      </p>
      <button
        type="button"
        onClick={() => onPageChange(safePage + 1)}
        disabled={safePage >= safeTotalPages}
      >
        Proxima
      </button>
    </nav>
  );
}
