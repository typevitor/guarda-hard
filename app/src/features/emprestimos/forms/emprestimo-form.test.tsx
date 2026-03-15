// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { EmprestimoForm } from './emprestimo-form';

describe('EmprestimoForm', () => {
  it('validates required usuarioId before submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EmprestimoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Hardware'), {
      target: { value: 'hardware-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Usuario e obrigatorio')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates required hardwareId before submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EmprestimoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'usuario-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Hardware e obrigatorio')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits payload when form is valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EmprestimoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'usuario-1' },
    });
    fireEvent.change(screen.getByLabelText('Hardware'), {
      target: { value: 'hardware-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
      });
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText('Usuario') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Hardware') as HTMLInputElement).value).toBe('');
  });

  it("shows 'Salvando...' while submit promise is pending", async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(<EmprestimoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'usuario-1' },
    });
    fireEvent.change(screen.getByLabelText('Hardware'), {
      target: { value: 'hardware-1' },
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

    render(<EmprestimoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'usuario-3' },
    });
    fireEvent.change(screen.getByLabelText('Hardware'), {
      target: { value: 'hardware-3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect((screen.getByLabelText('Usuario') as HTMLInputElement).value).toBe('usuario-3');
    expect((screen.getByLabelText('Hardware') as HTMLInputElement).value).toBe('hardware-3');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(false);
    });
  });

  it('renders cancelar action and triggers callback', () => {
    const onCancel = vi.fn();

    render(<EmprestimoForm onSubmit={vi.fn().mockResolvedValue(undefined)} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
