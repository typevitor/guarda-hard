// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';

import { FilterBar } from './filter-bar';

describe('FilterBar', () => {
  it('renders optional preset chips and calls onPresetChange', () => {
    const onPresetChange = vi.fn();

    render(
      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        onClearFilters={() => {}}
        presets={[
          { id: 'all', label: 'Todos' },
          { id: 'available', label: 'Disponiveis' },
        ]}
        activePresetId="all"
        onPresetChange={onPresetChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Disponiveis' }));

    expect(onPresetChange).toHaveBeenCalledWith('available');
    expect(screen.getByRole('button', { name: 'Todos' }).className.includes('is-active')).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: 'Todos' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Disponiveis' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('does not trigger callback for disabled preset chips', () => {
    const onPresetChange = vi.fn();

    render(
      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        onClearFilters={() => {}}
        presets={[{ id: 'broken', label: 'Com defeito', disabled: true }]}
        activePresetId="all"
        onPresetChange={onPresetChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Com defeito' }));

    expect(onPresetChange).not.toHaveBeenCalled();
  });

  it('supports keyboard activation for enabled chips without duplicate callbacks', () => {
    const onPresetChange = vi.fn();

    render(
      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        onClearFilters={() => {}}
        presets={[{ id: 'available', label: 'Disponiveis' }]}
        activePresetId="all"
        onPresetChange={onPresetChange}
      />,
    );

    const chip = screen.getByRole('button', { name: 'Disponiveis' });
    chip.focus();

    fireEvent.keyDown(chip, { key: 'Enter' });
    fireEvent.click(chip);
    expect(onPresetChange).toHaveBeenCalledTimes(1);
    expect(onPresetChange).toHaveBeenNthCalledWith(1, 'available');

    fireEvent.keyDown(chip, { key: ' ' });
    fireEvent.click(chip);
    expect(onPresetChange).toHaveBeenCalledTimes(2);
    expect(onPresetChange).toHaveBeenNthCalledWith(2, 'available');
  });

  it('keeps legacy mode working without presets', () => {
    const onSearchChange = vi.fn();
    const onClearFilters = vi.fn();

    render(
      <FilterBar
        searchValue=""
        searchPlaceholder="Buscar"
        onSearchChange={onSearchChange}
        onClearFilters={onClearFilters}
      />,
    );

    fireEvent.change(screen.getByLabelText('Buscar'), {
      target: { value: 'financeiro' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(onSearchChange).toHaveBeenCalledWith('financeiro');
    expect(onClearFilters).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('group', { name: 'Filtros rapidos' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Limpar filtros' }).className).toContain(
      'btn-secondary',
    );
  });
});
