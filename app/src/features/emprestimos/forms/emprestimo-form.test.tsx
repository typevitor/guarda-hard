// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { EmprestimoForm } from './emprestimo-form';

describe('EmprestimoForm', () => {
  const usuarioOptions = [
    { id: 'usuario-1', nome: 'Ana' },
    { id: 'usuario-2', nome: 'Bruno' },
  ];

  const hardwareOptions = [
    {
      id: 'hardware-1',
      descricao: 'Notebook',
      marca: 'Dell',
      modelo: 'Latitude',
      codigoPatrimonio: 'PAT-001',
    },
    {
      id: 'hardware-2',
      descricao: 'Monitor',
      marca: 'LG',
      modelo: 'UltraWide',
      codigoPatrimonio: 'PAT-002',
    },
  ];

  it('renders usuario and hardware selects and submits selected FK ids', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EmprestimoForm
        onSubmit={onSubmit}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
      />,
    );

    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'usuario-2' } });
    fireEvent.change(screen.getByLabelText('Hardware'), { target: { value: 'hardware-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        usuarioId: 'usuario-2',
        hardwareId: 'hardware-2',
      });
    });
  });

  it('disables submit when usuario options empty', () => {
    render(
      <EmprestimoForm
        onSubmit={vi.fn()}
        usuarioOptions={[]}
        hardwareOptions={hardwareOptions}
        disableSubmit
      />,
    );

    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);
  });

  it('disables submit when hardware options empty', () => {
    render(
      <EmprestimoForm
        onSubmit={vi.fn()}
        usuarioOptions={usuarioOptions}
        hardwareOptions={[]}
        disableSubmit
      />,
    );

    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);
  });

  it('disables submit when usuarioOptionsError or hardwareOptionsError exists', () => {
    const { rerender } = render(
      <EmprestimoForm
        onSubmit={vi.fn()}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
        usuarioOptionsError="Erro usuarios"
        disableSubmit
      />,
    );

    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);

    rerender(
      <EmprestimoForm
        onSubmit={vi.fn()}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
        hardwareOptionsError="Erro hardwares"
        disableSubmit
      />,
    );

    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);
  });

  it('renders options error messages with role="alert" when loading fails', () => {
    render(
      <EmprestimoForm
        onSubmit={vi.fn()}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
        usuarioOptionsError="Nao foi possivel carregar usuarios"
        hardwareOptionsError="Nao foi possivel carregar hardwares disponiveis"
      />,
    );

    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(screen.getByText('Nao foi possivel carregar usuarios')).toBeTruthy();
    expect(screen.getByText('Nao foi possivel carregar hardwares disponiveis')).toBeTruthy();
  });

  it('does not render options error alert when error is null/empty', () => {
    render(
      <EmprestimoForm
        onSubmit={vi.fn()}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
        usuarioOptionsError=""
        hardwareOptionsError={null}
      />,
    );

    expect(screen.queryByText('Nao foi possivel carregar usuarios')).toBeNull();
    expect(screen.queryByText('Nao foi possivel carregar hardwares disponiveis')).toBeNull();
  });

  it('renders both alerts in deterministic order (usuario first, hardware second)', () => {
    render(
      <EmprestimoForm
        onSubmit={vi.fn()}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
        usuarioOptionsError="Erro usuario"
        hardwareOptionsError="Erro hardware"
      />,
    );

    const alerts = screen.getAllByRole('alert').map((item) => item.textContent?.trim());

    expect(alerts).toEqual(['Erro usuario', 'Erro hardware']);
  });

  it('enables submit when both option arrays non-empty and no options error', () => {
    render(
      <EmprestimoForm
        onSubmit={vi.fn()}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
      />,
    );

    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(false);
  });

  it("shows 'Salvando...' while submit promise is pending", async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(
      <EmprestimoForm
        onSubmit={onSubmit}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
      />,
    );

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'usuario-1' },
    });
    fireEvent.change(screen.getByLabelText('Hardware'), {
      target: { value: 'hardware-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByRole('button', { name: 'Salvando...' }).hasAttribute('disabled')).toBe(
      true,
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    resolveSubmit?.();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(false);
    });
  });

  it('keeps values and re-enables submit on failure', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'));

    render(
      <EmprestimoForm
        onSubmit={onSubmit}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
      />,
    );

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'usuario-2' },
    });
    fireEvent.change(screen.getByLabelText('Hardware'), {
      target: { value: 'hardware-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect((screen.getByLabelText('Usuario') as HTMLSelectElement).value).toBe('usuario-2');
    expect((screen.getByLabelText('Hardware') as HTMLSelectElement).value).toBe('hardware-2');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(false);
    });
  });

  it('renders cancelar action and triggers callback', () => {
    const onCancel = vi.fn();

    render(
      <EmprestimoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={onCancel}
        usuarioOptions={usuarioOptions}
        hardwareOptions={hardwareOptions}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
