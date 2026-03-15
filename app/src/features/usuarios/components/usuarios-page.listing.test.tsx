// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
  usePathname: () => '/usuarios',
}));

import { UsuariosPage } from './usuarios-page';

describe('UsuariosPage listing flow', () => {
  const departamentoOptions = [
    { id: 'dep-1', nome: 'Suporte' },
    { id: 'dep-2', nome: 'Administracao' },
    { id: 'dep-3', nome: 'Comercial' },
  ];

  const baseList = {
    items: [
      {
        id: 'user-1',
        empresaId: 'emp-1',
        departamentoId: 'dep-1',
        nome: 'Ana',
        email: 'ana@example.com',
        ativo: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'user-2',
        empresaId: 'emp-1',
        departamentoId: '',
        nome: 'Bruno',
        email: 'bruno@example.com',
        ativo: true,
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
    departamentoId: '',
    ativo: undefined,
  };

  beforeEach(() => {
    refreshMock.mockReset();
    pushMock.mockReset();
  });

  it("opens modal with 'Novo usuario' and refreshes after successful save", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <UsuariosPage
        onSubmit={onSubmit}
        list={baseList}
        query={baseQuery}
        departamentoOptions={departamentoOptions}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Novo usuario' }));
    expect(screen.getByRole('dialog', { name: 'Novo usuario' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Bruno' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bruno@example.com' } });
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'dep-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nome: 'Bruno',
        email: 'bruno@example.com',
        departamentoId: 'dep-2',
      });
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Novo usuario' })).toBeNull();
  });

  it('keeps modal open and preserves values on failure', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'));

    render(
      <UsuariosPage
        onSubmit={onSubmit}
        list={baseList}
        query={baseQuery}
        departamentoOptions={departamentoOptions}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Novo usuario' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Carla' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'carla@example.com' } });
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'dep-3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Nao foi possivel criar usuario')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Novo usuario' })).toBeTruthy();
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Carla');
  });

  it('applies usuarios presets and keeps sentinel values out of URL', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <UsuariosPage
        onSubmit={onSubmit}
        list={baseList}
        query={{ ...baseQuery, search: 'ana' }}
        departamentoOptions={departamentoOptions}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Com departamento' }));
    expect(pushMock).toHaveBeenLastCalledWith('/usuarios?page=1&search=ana');
    expect(pushMock).not.toHaveBeenCalledWith(expect.stringContaining('__withDepartamento'));

    expect(screen.getByRole('cell', { name: 'Ana' })).toBeTruthy();
    expect(screen.queryByRole('cell', { name: 'Bruno' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Sem departamento' }));
    expect(pushMock).toHaveBeenLastCalledWith('/usuarios?page=1&search=ana');
    expect(pushMock).not.toHaveBeenCalledWith(expect.stringContaining('__withoutDepartamento'));

    expect(screen.getByRole('cell', { name: 'Bruno' })).toBeTruthy();
    expect(screen.queryByRole('cell', { name: 'Ana' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    expect(pushMock).toHaveBeenLastCalledWith('/usuarios?page=1&search=ana');

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'br' } });
    expect(pushMock).toHaveBeenLastCalledWith('/usuarios?page=1&search=br');

    expect(
      screen.getByRole('button', { name: 'Novo usuario' }).className.includes('btn-primary'),
    ).toBe(true);
    expect(screen.getByLabelText('Filtros').className.includes('filter-bar')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Proxima' }));
    expect(pushMock).toHaveBeenCalledWith('/usuarios?page=2&search=br');
  });
});
