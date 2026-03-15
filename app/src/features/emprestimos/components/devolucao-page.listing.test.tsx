// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
  usePathname: () => '/devolucao',
}));

const { fetchOpenEmprestimosForDevolucaoMock } = vi.hoisted(() => ({
  fetchOpenEmprestimosForDevolucaoMock: vi.fn(),
}));

vi.mock('../client/devolucoes-open-selector-client', () => ({
  fetchOpenEmprestimosForDevolucao: fetchOpenEmprestimosForDevolucaoMock,
}));

import { DevolucaoPage } from './devolucao-page';

describe('DevolucaoPage listing flow', () => {
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const monthIndex = now.getMonth();
  const inMonthDate = new Date(now.getFullYear(), monthIndex, Math.min(10, now.getDate() || 10));
  const inMonthIso = inMonthDate.toISOString().slice(0, 10);
  const outsideMonthIso = new Date(now.getFullYear(), monthIndex - 1, 15)
    .toISOString()
    .slice(0, 10);

  const baseList = {
    items: [
      {
        id: 'emp-r-1',
        empresaId: 'emp-1',
        usuarioId: 'user-1',
        hardwareId: 'hw-1',
        dataRetirada: '2026-03-01',
        dataDevolucao: todayIso,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'emp-r-2',
        empresaId: 'emp-1',
        usuarioId: 'user-2',
        hardwareId: 'hw-2',
        dataRetirada: '2026-02-01',
        dataDevolucao: inMonthIso,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'emp-r-3',
        empresaId: 'emp-1',
        usuarioId: 'user-3',
        hardwareId: 'hw-3',
        dataRetirada: '2026-01-01',
        dataDevolucao: outsideMonthIso,
        createdAt: '',
        updatedAt: '',
      },
    ],
    page: 2,
    pageSize: 10 as const,
    total: 11,
    totalPages: 4,
  };

  const baseQuery = {
    page: 2,
    pageSize: 10 as const,
    search: '',
    status: 'returned' as const,
    usuarioId: '',
    hardwareId: '',
    retiradaFrom: undefined,
    retiradaTo: undefined,
    devolucaoFrom: undefined,
    devolucaoTo: undefined,
  };

  beforeEach(() => {
    refreshMock.mockReset();
    pushMock.mockReset();
    fetchOpenEmprestimosForDevolucaoMock.mockReset();
  });

  it('requires selecting open emprestimo before enabling submit', async () => {
    fetchOpenEmprestimosForDevolucaoMock.mockResolvedValue({
      items: [{ value: 'emp-1', label: 'emp-1 - usuario user-1 - hardware hw-1' }],
      page: 1,
      totalPages: 1,
    });

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DevolucaoPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nova devolucao' }));
    await screen.findByRole('option', { name: 'emp-1 - usuario user-1 - hardware hw-1' });

    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByLabelText('Emprestimo'), { target: { value: 'emp-1' } });
    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(false);

    expect(screen.getByRole('button', { name: 'Todos' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Devolvidos hoje' }).hasAttribute('disabled')).toBe(
      false,
    );
    expect(screen.getByRole('button', { name: 'Esta semana' }).hasAttribute('disabled')).toBe(
      false,
    );
    expect(screen.getByRole('button', { name: 'Este mes' }).hasAttribute('disabled')).toBe(false);
  });

  it('submits selected id to devolucao endpoint path contract', async () => {
    fetchOpenEmprestimosForDevolucaoMock.mockResolvedValue({
      items: [{ value: 'emp-2', label: 'emp-2 - usuario user-2 - hardware hw-2' }],
      page: 1,
      totalPages: 1,
    });

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DevolucaoPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nova devolucao' }));
    await screen.findByRole('option', { name: 'emp-2 - usuario user-2 - hardware hw-2' });
    fireEvent.change(screen.getByLabelText('Emprestimo'), { target: { value: 'emp-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ emprestimoId: 'emp-2' });
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('shows stale-id error while keeping modal open', async () => {
    fetchOpenEmprestimosForDevolucaoMock.mockResolvedValue({
      items: [{ value: 'emp-3', label: 'emp-3 - usuario user-3 - hardware hw-3' }],
      page: 1,
      totalPages: 1,
    });

    const onSubmit = vi.fn().mockRejectedValue(new Error('stale'));
    render(<DevolucaoPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nova devolucao' }));
    await screen.findByRole('option', { name: 'emp-3 - usuario user-3 - hardware hw-3' });
    fireEvent.change(screen.getByLabelText('Emprestimo'), { target: { value: 'emp-3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Nao foi possivel registrar devolucao')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Nova devolucao' })).toBeTruthy();
  });

  it('supports loading additional selector pages', async () => {
    fetchOpenEmprestimosForDevolucaoMock
      .mockResolvedValueOnce({
        items: [{ value: 'emp-4', label: 'emp-4 - usuario user-4 - hardware hw-4' }],
        page: 1,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [{ value: 'emp-5', label: 'emp-5 - usuario user-5 - hardware hw-5' }],
        page: 2,
        totalPages: 2,
      });

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DevolucaoPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nova devolucao' }));
    await screen.findByRole('option', { name: 'emp-4 - usuario user-4 - hardware hw-4' });
    fireEvent.click(screen.getByRole('button', { name: 'Carregar mais' }));

    await screen.findByRole('option', { name: 'emp-5 - usuario user-5 - hardware hw-5' });
    expect(fetchOpenEmprestimosForDevolucaoMock).toHaveBeenNthCalledWith(2, 2, undefined);
  });

  it('disables submit and shows empty-state when no open emprestimos', async () => {
    fetchOpenEmprestimosForDevolucaoMock.mockResolvedValue({
      items: [],
      page: 1,
      totalPages: 1,
    });

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DevolucaoPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nova devolucao' }));
    expect(await screen.findByText('Nao ha emprestimos em aberto para devolucao.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);
  });

  it('keeps status returned on search, pagination and preset selection', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <DevolucaoPage onSubmit={onSubmit} list={baseList} query={{ ...baseQuery, search: 'u1' }} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    expect(pushMock).toHaveBeenLastCalledWith('/devolucao?page=1&status=returned&search=u1');

    fireEvent.click(screen.getByRole('button', { name: 'Devolvidos hoje' }));
    expect(pushMock).toHaveBeenLastCalledWith('/devolucao?page=1&status=returned&search=u1');

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'u2' } });
    expect(pushMock).toHaveBeenLastCalledWith('/devolucao?page=1&status=returned&search=u2');

    fireEvent.click(screen.getByRole('button', { name: 'Proxima' }));
    expect(pushMock).toHaveBeenLastCalledWith('/devolucao?page=2&status=returned&search=u2');
  });

  it('filters devolucoes client-side by selected date preset', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DevolucaoPage onSubmit={onSubmit} list={baseList} query={baseQuery} />);

    expect(screen.getByRole('cell', { name: 'user-1' })).toBeTruthy();
    expect(screen.getByRole('cell', { name: 'user-2' })).toBeTruthy();
    expect(screen.getByRole('cell', { name: 'user-3' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Devolvidos hoje' }));

    expect(screen.getByRole('cell', { name: 'user-1' })).toBeTruthy();
    expect(screen.queryByRole('cell', { name: 'user-3' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Este mes' }));

    expect(screen.getByRole('cell', { name: 'user-1' })).toBeTruthy();
    expect(screen.getByRole('cell', { name: 'user-2' })).toBeTruthy();
    expect(screen.queryByRole('cell', { name: 'user-3' })).toBeNull();
  });
});
