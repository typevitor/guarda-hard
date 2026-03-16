// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
    push: pushMock,
  }),
  usePathname: () => '/departamentos',
}));

import { DepartamentosPage } from './departamentos-page';

describe('DepartamentosPage', () => {
  const baseList = {
    items: [{ id: 'dep-1', empresaId: 'emp-1', nome: 'Financeiro', createdAt: '', updatedAt: '' }],
    page: 2,
    pageSize: 10 as const,
    total: 11,
    totalPages: 4,
  };

  const baseQuery = {
    page: 2,
    pageSize: 10 as const,
    search: '',
  };

  beforeEach(() => {
    refreshMock.mockReset();
    pushMock.mockReset();
  });

  it('opens modal with Novo departamento and shows success feedback after submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<DepartamentosPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo departamento' }));
    expect(screen.getByRole('dialog', { name: 'Novo departamento' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Financeiro' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ nome: 'Financeiro' });
    });
    expect(await screen.findByText('Departamento criado com sucesso')).toBeTruthy();
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Novo departamento' })).toBeNull();
  });

  it('keeps modal open and preserves input on failure', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'));

    render(<DepartamentosPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo departamento' }));

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Suporte' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Nao foi possivel criar departamento')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Novo departamento' })).toBeTruthy();
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Suporte');
  });

  it('resets page to 1 on filter change and preserves filters on pagination', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <DepartamentosPage
        onSubmit={onSubmit}
        list={baseList}
        query={{ ...baseQuery, search: 'financeiro' }}
      />,
    );

    fireEvent.change(screen.getByLabelText('Buscar'), {
      target: { value: 'suporte' },
    });
    expect(pushMock).toHaveBeenCalledWith('/departamentos?page=1&search=suporte');

    expect(
      screen.getByRole('button', { name: 'Novo departamento' }).className.includes('btn-primary'),
    ).toBe(true);
    expect(screen.getByLabelText('Filtros').className.includes('filter-bar')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Proxima' }));
    expect(pushMock).toHaveBeenCalledWith('/departamentos?page=2&search=suporte');
  });
});
