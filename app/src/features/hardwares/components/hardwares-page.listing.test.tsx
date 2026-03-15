// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
  usePathname: () => '/hardwares',
}));

import { HardwaresPage } from './hardwares-page';

describe('HardwaresPage listing flow', () => {
  const baseList = {
    items: [
      {
        id: 'hw-1',
        empresaId: 'emp-1',
        descricao: 'Notebook',
        marca: 'Dell',
        modelo: 'XPS',
        codigoPatrimonio: 'PAT-1',
        funcionando: true,
        descricaoProblema: null,
        livre: true,
        version: 1,
        createdAt: '',
        updatedAt: '',
      },
    ],
    page: 2,
    pageSize: 10,
    total: 11,
    totalPages: 4,
  };

  const baseQuery = {
    page: 2,
    pageSize: 10 as const,
    search: '',
    livre: undefined,
    funcionando: undefined,
  };

  beforeEach(() => {
    refreshMock.mockReset();
    pushMock.mockReset();
  });

  it("opens modal with 'Novo hardware' and refreshes after successful save", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<HardwaresPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo hardware' }));
    fireEvent.change(screen.getByLabelText('Descricao'), { target: { value: 'Monitor' } });
    fireEvent.change(screen.getByLabelText('Codigo patrimonio'), { target: { value: 'PAT-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ descricao: 'Monitor', codigoPatrimonio: 'PAT-2' });
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Novo hardware' })).toBeNull();
  });

  it('keeps modal open and preserves values on failure', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'));

    render(<HardwaresPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo hardware' }));
    fireEvent.change(screen.getByLabelText('Descricao'), { target: { value: 'Teclado' } });
    fireEvent.change(screen.getByLabelText('Codigo patrimonio'), { target: { value: 'PAT-3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Nao foi possivel criar hardware')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Novo hardware' })).toBeTruthy();
    expect((screen.getByLabelText('Descricao') as HTMLInputElement).value).toBe('Teclado');
  });

  it('maps hardwares preset chips to expected query and resets page', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <HardwaresPage
        onSubmit={onSubmit}
        list={baseList}
        query={{ ...baseQuery, search: 'note' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Disponiveis' }));
    expect(pushMock).toHaveBeenLastCalledWith('/hardwares?page=1&search=note&livre=true');

    fireEvent.click(screen.getByRole('button', { name: 'Em uso' }));
    expect(pushMock).toHaveBeenLastCalledWith('/hardwares?page=1&search=note&livre=false');

    fireEvent.click(screen.getByRole('button', { name: 'Com defeito' }));
    expect(pushMock).toHaveBeenLastCalledWith('/hardwares?page=1&search=note&funcionando=false');

    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    expect(pushMock).toHaveBeenLastCalledWith('/hardwares?page=1&search=note');

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'mon' } });
    expect(pushMock).toHaveBeenLastCalledWith('/hardwares?page=1&search=mon');

    expect(
      screen.getByRole('button', { name: 'Novo hardware' }).className.includes('btn-primary'),
    ).toBe(true);
    expect(screen.getByLabelText('Filtros').className.includes('filter-bar')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Proxima' }));
    expect(pushMock).toHaveBeenCalledWith('/hardwares?page=2&search=mon');
  });
});
