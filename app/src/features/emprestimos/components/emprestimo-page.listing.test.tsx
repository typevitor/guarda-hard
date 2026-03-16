// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
  usePathname: () => '/emprestimo',
}));

import { EmprestimoPage } from './emprestimo-page';

describe('EmprestimoPage listing flow', () => {
  const usuarioOptions = [
    { id: 'user-1', nome: 'Ana' },
    { id: 'user-2', nome: 'Bruno' },
  ];

  const hardwareOptions = [
    {
      id: 'hw-1',
      descricao: 'Notebook',
      marca: 'Dell',
      modelo: 'Latitude',
      codigoPatrimonio: 'PAT-001',
    },
    {
      id: 'hw-2',
      descricao: 'Monitor',
      marca: 'LG',
      modelo: 'UltraWide',
      codigoPatrimonio: 'PAT-002',
    },
  ];

  const baseList = {
    items: [
      {
        id: 'emp-1',
        empresaId: 'emp-1',
        usuarioId: 'user-1',
        hardwareId: 'hw-1',
        dataRetirada: '2026-03-01',
        dataDevolucao: null,
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
    status: 'open' as const,
    usuarioId: '',
    hardwareId: '',
    retiradaFrom: undefined,
    retiradaTo: undefined,
  };

  beforeEach(() => {
    refreshMock.mockReset();
    pushMock.mockReset();
  });

  it("renders operation-specific open list and creates via modal with 'Novo emprestimo'", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EmprestimoPage
        onSubmit={onSubmit}
        list={baseList}
        query={baseQuery}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
      />,
    );

    expect(screen.getByRole('cell', { name: 'user-1' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Novo emprestimo' }));
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'user-2' } });
    fireEvent.change(screen.getByLabelText('Hardware'), { target: { value: 'hw-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ usuarioId: 'user-2', hardwareId: 'hw-2' });
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('keeps modal open and preserves values on failure', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'));

    render(
      <EmprestimoPage
        onSubmit={onSubmit}
        list={baseList}
        query={baseQuery}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Novo emprestimo' }));
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'user-1' } });
    fireEvent.change(screen.getByLabelText('Hardware'), { target: { value: 'hw-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Nao foi possivel registrar emprestimo')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Novo emprestimo' })).toBeTruthy();
    expect((screen.getByLabelText('Usuario') as HTMLSelectElement).value).toBe('user-1');
  });

  it('resets page on filter and keeps filter on pagination', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
        <EmprestimoPage
          onSubmit={onSubmit}
          list={baseList}
          query={{ ...baseQuery, search: 'user' }}
          usuarioOptions={usuarioOptions}
          hardwareOptions={hardwareOptions}
        />,
      );

    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    expect(pushMock).toHaveBeenLastCalledWith('/emprestimo?page=1&status=open&search=user');

    fireEvent.click(screen.getByRole('button', { name: 'Abertos' }));
    expect(pushMock).toHaveBeenLastCalledWith('/emprestimo?page=1&status=open&search=user');

    expect(screen.getByRole('button', { name: 'Vencendo hoje' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: 'Atrasados' }).hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'new' } });
    expect(pushMock).toHaveBeenLastCalledWith('/emprestimo?page=1&status=open&search=new');

    expect(
      screen.getByRole('button', { name: 'Novo emprestimo' }).className.includes('btn-primary'),
    ).toBe(true);
    expect(screen.getByLabelText('Filtros').className.includes('filter-bar')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Proxima' }));
    expect(pushMock).toHaveBeenCalledWith('/emprestimo?page=2&status=open&search=new');
  });

  it('disables submit in modal when options arrays are empty', () => {
    render(
      <EmprestimoPage
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        list={baseList}
        query={baseQuery}
        usuarioOptions={[]}
        hardwareOptions={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Novo emprestimo' }));

    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);
  });

  it('disables submit in modal when options errors exist', () => {
    render(
      <EmprestimoPage
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        list={baseList}
        query={baseQuery}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
        usuarioOptionsError="Nao foi possivel carregar usuarios"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Novo emprestimo' }));

    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);
  });
});
