// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { HardwareListResponse } from '../server/hardwares-list-api';

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
  usePathname: () => '/hardwares',
}));

import { HardwaresPage } from './hardwares-page';

describe('HardwaresPage listing flow', () => {
  const baseList: HardwareListResponse = {
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
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });

    render(<HardwaresPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo hardware' }));
    fireEvent.change(screen.getByLabelText('Descricao'), { target: { value: 'Monitor' } });
    fireEvent.change(screen.getByLabelText('Marca'), { target: { value: 'LG' } });
    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'Ultrawide' } });
    fireEvent.change(screen.getByLabelText('Codigo patrimonio'), { target: { value: 'PAT-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        descricao: 'Monitor',
        marca: 'LG',
        modelo: 'Ultrawide',
        codigoPatrimonio: 'PAT-2',
      });
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Novo hardware' })).toBeNull();
  });

  it('keeps modal open and preserves values on failure', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      message: 'marca should not be empty',
    });

    render(<HardwaresPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo hardware' }));
    fireEvent.change(screen.getByLabelText('Descricao'), { target: { value: 'Teclado' } });
    fireEvent.change(screen.getByLabelText('Marca'), { target: { value: 'Logitech' } });
    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'K380' } });
    fireEvent.change(screen.getByLabelText('Codigo patrimonio'), { target: { value: 'PAT-3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('marca should not be empty')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Novo hardware' })).toBeTruthy();
    expect((screen.getByLabelText('Descricao') as HTMLInputElement).value).toBe('Teclado');
    expect((screen.getByLabelText('Marca') as HTMLInputElement).value).toBe('Logitech');
    expect((screen.getByLabelText('Modelo') as HTMLInputElement).value).toBe('K380');
  });

  it('maps create errors by status to actionable text', async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 400, message: 'Payload invalido' })
      .mockResolvedValueOnce({ ok: false, status: 401, message: 'Unauthorized' })
      .mockResolvedValueOnce({ ok: false, status: 500, message: '' });

    render(<HardwaresPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo hardware' }));
    fireEvent.change(screen.getByLabelText('Descricao'), { target: { value: 'Monitor' } });
    fireEvent.change(screen.getByLabelText('Marca'), { target: { value: 'LG' } });
    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'Ultra' } });
    fireEvent.change(screen.getByLabelText('Codigo patrimonio'), { target: { value: 'PAT-40' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Payload invalido')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(
      await screen.findByText('Sua sessao nao permite criar hardware nesta empresa. Entre novamente.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Nao foi possivel criar hardware')).toBeTruthy();
  });

  it('maps hardwares preset chips to expected query and resets page', () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });

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
