// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DepartamentoForm } from './departamento-form';

describe('DepartamentoForm', () => {
  it('validates required nome before submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<DepartamentoForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Nome e obrigatorio')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits payload when nome is valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<DepartamentoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Financeiro' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ nome: 'Financeiro' });
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('');
  });

  it('does not reset field when submit fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'));

    render(<DepartamentoForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Financeiro' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ nome: 'Financeiro' });
    });
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Financeiro');
  });
});
