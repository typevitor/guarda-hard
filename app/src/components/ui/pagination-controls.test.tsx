// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';

import { PaginationControls } from './pagination-controls';

describe('PaginationControls', () => {
  it('uses concise pagination labels', () => {
    const onPageChange = vi.fn();

    const { rerender } = render(
      <PaginationControls page={1} totalPages={3} onPageChange={onPageChange} />,
    );

    expect(screen.getByRole('button', { name: 'Anterior' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Proxima' }).hasAttribute('disabled')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Pagina anterior' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Proxima pagina' })).toBeNull();

    rerender(<PaginationControls page={3} totalPages={3} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: 'Anterior' }).hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('button', { name: 'Proxima' }).hasAttribute('disabled')).toBe(true);
  });

  it('fires onPageChange for next and previous actions', () => {
    const onPageChange = vi.fn();

    render(<PaginationControls page={2} totalPages={3} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Proxima' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it('disables previous on first page and next on last page', () => {
    const onPageChange = vi.fn();

    const { rerender } = render(
      <PaginationControls page={1} totalPages={3} onPageChange={onPageChange} />,
    );

    expect(screen.getByRole('button', { name: 'Anterior' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Proxima' }).hasAttribute('disabled')).toBe(false);

    rerender(<PaginationControls page={3} totalPages={3} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: 'Anterior' }).hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('button', { name: 'Proxima' }).hasAttribute('disabled')).toBe(true);
  });
});
