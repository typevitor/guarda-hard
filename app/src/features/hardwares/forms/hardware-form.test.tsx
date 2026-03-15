// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { HardwareForm } from './hardware-form';

describe('HardwareForm', () => {
  it('validates required descricao before submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<HardwareForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Codigo patrimonio'), {
      target: { value: 'PAT-001' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Descricao e obrigatoria')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates required codigoPatrimonio before submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<HardwareForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Descricao'), {
      target: { value: 'Notebook Dell' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Codigo patrimonio e obrigatorio')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits payload when form is valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<HardwareForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Descricao'), {
      target: { value: 'Notebook Dell' },
    });
    fireEvent.change(screen.getByLabelText('Codigo patrimonio'), {
      target: { value: 'PAT-001' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        descricao: 'Notebook Dell',
        codigoPatrimonio: 'PAT-001',
      });
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText('Descricao') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Codigo patrimonio') as HTMLInputElement).value).toBe('');
  });

  it("shows 'Salvando...' while submit promise is pending", async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(<HardwareForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Descricao'), {
      target: { value: 'Notebook Dell' },
    });
    fireEvent.change(screen.getByLabelText('Codigo patrimonio'), {
      target: { value: 'PAT-001' },
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

    render(<HardwareForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Descricao'), {
      target: { value: 'Teclado' },
    });
    fireEvent.change(screen.getByLabelText('Codigo patrimonio'), {
      target: { value: 'PAT-999' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect((screen.getByLabelText('Descricao') as HTMLInputElement).value).toBe('Teclado');
    expect((screen.getByLabelText('Codigo patrimonio') as HTMLInputElement).value).toBe('PAT-999');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(false);
    });
  });

  it('renders cancelar action and triggers callback', () => {
    const onCancel = vi.fn();

    render(<HardwareForm onSubmit={vi.fn().mockResolvedValue(undefined)} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
