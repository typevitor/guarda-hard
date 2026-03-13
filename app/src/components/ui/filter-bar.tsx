"use client";

type FilterBarProps = {
  searchValue: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
};

export function FilterBar({
  searchValue,
  searchPlaceholder = "Buscar",
  onSearchChange,
  onClearFilters,
}: FilterBarProps) {
  return (
    <div className="filter-bar" aria-label="Filtros">
      <label htmlFor="list-search" className="filter-label">
        Buscar
      </label>
      <input
        id="list-search"
        type="search"
        value={searchValue}
        placeholder={searchPlaceholder}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <button type="button" onClick={onClearFilters}>
        Limpar filtros
      </button>
    </div>
  );
}
