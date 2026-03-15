// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { UsuarioForm } from './usuario-form';

describe('UsuarioForm', () => {
  const departamentoOptions = [
    { id: 'dep-1', nome: 'Suporte' },
    { id: 'dep-2', nome: 'Administracao' },
  ];

  it('validates required nome before submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<UsuarioForm onSubmit={onSubmit} departamentoOptions={departamentoOptions} />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Departamento'), {
      target: { value: 'dep-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Nome e obrigatorio')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates email format before submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<UsuarioForm onSubmit={onSubmit} departamentoOptions={departamentoOptions} />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'invalido' },
    });
    fireEvent.change(screen.getByLabelText('Departamento'), {
      target: { value: 'dep-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Email invalido')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits payload when form is valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<UsuarioForm onSubmit={onSubmit} departamentoOptions={departamentoOptions} />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Departamento'), {
      target: { value: 'dep-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nome: 'Ana',
        email: 'ana@example.com',
        departamentoId: 'dep-1',
      });
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Departamento') as HTMLSelectElement).value).toBe('');
  });

  it('submits with empty departamento as optional value', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<UsuarioForm onSubmit={onSubmit} departamentoOptions={departamentoOptions} />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Sem Depto' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'semdepto@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Departamento'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nome: 'Sem Depto',
        email: 'semdepto@example.com',
        departamentoId: '',
      });
    });
  });

  it("shows 'Salvando...' while submit promise is pending", async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(<UsuarioForm onSubmit={onSubmit} departamentoOptions={departamentoOptions} />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Departamento'), {
      target: { value: 'dep-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByRole('button', { name: 'Salvando...' }).hasAttribute('disabled')).toBe(true);

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

    render(<UsuarioForm onSubmit={onSubmit} departamentoOptions={departamentoOptions} />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Carla' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'carla@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Departamento'), {
      target: { value: 'dep-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Carla');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('carla@example.com');
    expect((screen.getByLabelText('Departamento') as HTMLSelectElement).value).toBe('dep-2');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(false);
    });
  });

  it('renders cancelar action and triggers callback', () => {
    const onCancel = vi.fn();

    render(
      <UsuarioForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={onCancel}
        departamentoOptions={departamentoOptions}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
