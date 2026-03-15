// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DevolucaoForm } from './devolucao-form';

const { fetchOpenEmprestimosForDevolucaoMock } = vi.hoisted(() => ({
  fetchOpenEmprestimosForDevolucaoMock: vi.fn(),
}));

vi.mock('../client/devolucoes-open-selector-client', () => ({
  fetchOpenEmprestimosForDevolucao: fetchOpenEmprestimosForDevolucaoMock,
}));

describe('DevolucaoForm', () => {
  beforeEach(() => {
    fetchOpenEmprestimosForDevolucaoMock.mockReset();
  });

  it('keeps submit disabled until an open emprestimo is selected', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    fetchOpenEmprestimosForDevolucaoMock.mockResolvedValue({
      items: [{ value: 'emp-1', label: 'emp-1 - usuario user-1 - hardware hw-1' }],
      page: 1,
      totalPages: 1,
    });

    render(<DevolucaoForm onSubmit={onSubmit} />);

    await screen.findByRole('option', { name: 'emp-1 - usuario user-1 - hardware hw-1' });
    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByLabelText('Emprestimo'), {
      target: { value: 'emp-1' },
    });

    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(false);
  });

  it('submits selected emprestimo id', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    fetchOpenEmprestimosForDevolucaoMock.mockResolvedValue({
      items: [{ value: 'emprestimo-1', label: 'emprestimo-1 - usuario user-1 - hardware hw-1' }],
      page: 1,
      totalPages: 1,
    });

    render(<DevolucaoForm onSubmit={onSubmit} />);

    await screen.findByRole('option', {
      name: 'emprestimo-1 - usuario user-1 - hardware hw-1',
    });
    fireEvent.change(screen.getByLabelText('Emprestimo'), {
      target: { value: 'emprestimo-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ emprestimoId: 'emprestimo-1' });
    });
  });

  it('loads additional pages and keeps selected value when submit fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'));
    fetchOpenEmprestimosForDevolucaoMock
      .mockResolvedValueOnce({
        items: [{ value: 'emp-1', label: 'emp-1 - usuario user-1 - hardware hw-1' }],
        page: 1,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [{ value: 'emp-2', label: 'emp-2 - usuario user-2 - hardware hw-2' }],
        page: 2,
        totalPages: 2,
      });

    render(<DevolucaoForm onSubmit={onSubmit} />);

    await screen.findByRole('option', { name: 'emp-1 - usuario user-1 - hardware hw-1' });
    fireEvent.click(screen.getByRole('button', { name: 'Carregar mais' }));
    await screen.findByRole('option', { name: 'emp-2 - usuario user-2 - hardware hw-2' });

    fireEvent.change(screen.getByLabelText('Emprestimo'), {
      target: { value: 'emp-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ emprestimoId: 'emp-2' });
    });
    expect(fetchOpenEmprestimosForDevolucaoMock).toHaveBeenNthCalledWith(2, 2, undefined);
    expect((screen.getByLabelText('Emprestimo') as HTMLSelectElement).value).toBe('emp-2');
  });

  it("shows 'Salvando...' while submit promise is pending", async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    fetchOpenEmprestimosForDevolucaoMock.mockResolvedValue({
      items: [{ value: 'emp-1', label: 'emp-1 - usuario user-1 - hardware hw-1' }],
      page: 1,
      totalPages: 1,
    });

    render(<DevolucaoForm onSubmit={onSubmit} />);

    await screen.findByRole('option', { name: 'emp-1 - usuario user-1 - hardware hw-1' });
    fireEvent.change(screen.getByLabelText('Emprestimo'), {
      target: { value: 'emp-1' },
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

  it('re-enables submit on failure and keeps selection', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'));
    fetchOpenEmprestimosForDevolucaoMock.mockResolvedValue({
      items: [{ value: 'emp-1', label: 'emp-1 - usuario user-1 - hardware hw-1' }],
      page: 1,
      totalPages: 1,
    });

    render(<DevolucaoForm onSubmit={onSubmit} />);

    await screen.findByRole('option', { name: 'emp-1 - usuario user-1 - hardware hw-1' });
    fireEvent.change(screen.getByLabelText('Emprestimo'), {
      target: { value: 'emp-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(false);
    expect((screen.getByLabelText('Emprestimo') as HTMLSelectElement).value).toBe('emp-1');
  });

  it('resets invalid selected emprestimo when search results change', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    fetchOpenEmprestimosForDevolucaoMock
      .mockResolvedValueOnce({
        items: [{ value: 'emp-1', label: 'emp-1 - usuario user-1 - hardware hw-1' }],
        page: 1,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        items: [{ value: 'emp-2', label: 'emp-2 - usuario user-2 - hardware hw-2' }],
        page: 1,
        totalPages: 1,
      });

    render(<DevolucaoForm onSubmit={onSubmit} />);

    await screen.findByRole('option', { name: 'emp-1 - usuario user-1 - hardware hw-1' });
    fireEvent.change(screen.getByLabelText('Emprestimo'), {
      target: { value: 'emp-1' },
    });

    fireEvent.change(screen.getByLabelText('Buscar'), {
      target: { value: 'user-2' },
    });

    await screen.findByRole('option', { name: 'emp-2 - usuario user-2 - hardware hw-2' });

    expect((screen.getByLabelText('Emprestimo') as HTMLSelectElement).value).toBe('');
    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);
  });

  it('ignores stale load-more response after search changes', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    let resolveLoadMore:
      | ((value: {
          items: { value: string; label: string }[];
          page: number;
          totalPages: number;
        }) => void)
      | null = null;

    fetchOpenEmprestimosForDevolucaoMock
      .mockResolvedValueOnce({
        items: [{ value: 'emp-1', label: 'emp-1 - usuario user-1 - hardware hw-1' }],
        page: 1,
        totalPages: 2,
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveLoadMore = resolve;
          }),
      )
      .mockResolvedValueOnce({
        items: [{ value: 'emp-2', label: 'emp-2 - usuario user-2 - hardware hw-2' }],
        page: 1,
        totalPages: 1,
      });

    render(<DevolucaoForm onSubmit={onSubmit} />);

    await screen.findByRole('option', { name: 'emp-1 - usuario user-1 - hardware hw-1' });
    fireEvent.click(screen.getByRole('button', { name: 'Carregar mais' }));
    fireEvent.change(screen.getByLabelText('Buscar'), {
      target: { value: 'user-2' },
    });

    await screen.findByRole('option', { name: 'emp-2 - usuario user-2 - hardware hw-2' });

    resolveLoadMore?.({
      items: [{ value: 'emp-old', label: 'emp-old - usuario user-old - hardware hw-old' }],
      page: 2,
      totalPages: 2,
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('option', { name: 'emp-old - usuario user-old - hardware hw-old' }),
      ).toBeNull();
    });
  });

  it('renders cancelar action and triggers callback', async () => {
    const onCancel = vi.fn();
    fetchOpenEmprestimosForDevolucaoMock.mockResolvedValue({
      items: [],
      page: 1,
      totalPages: 1,
    });

    render(<DevolucaoForm onSubmit={vi.fn().mockResolvedValue(undefined)} onCancel={onCancel} />);

    await screen.findByText('Nao ha emprestimos em aberto para devolucao.');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
