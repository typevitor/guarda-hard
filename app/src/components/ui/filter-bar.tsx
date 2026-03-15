'use client';

type FilterBarProps = {
  searchValue: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  presets?: FilterPreset[];
  activePresetId?: string;
  onPresetChange?: (presetId: string) => void;
};

type FilterPreset = {
  id: string;
  label: string;
  disabled?: boolean;
};

export function FilterBar({
  searchValue,
  searchPlaceholder = 'Buscar',
  onSearchChange,
  onClearFilters,
  presets,
  activePresetId,
  onPresetChange,
}: FilterBarProps) {
  const hasPresets = Boolean(presets?.length);

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
      <button type="button" className="btn-secondary" onClick={onClearFilters}>
        Limpar filtros
      </button>
      {hasPresets ? (
        <div className="filter-presets" role="group" aria-label="Filtros rapidos">
          {presets?.map((preset) => {
            const isActive = preset.id === activePresetId;

            return (
              <button
                key={preset.id}
                type="button"
                className={isActive ? 'filter-chip is-active' : 'filter-chip'}
                aria-pressed={isActive}
                disabled={preset.disabled}
                onClick={() => {
                  if (!preset.disabled) {
                    onPresetChange?.(preset.id);
                  }
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
