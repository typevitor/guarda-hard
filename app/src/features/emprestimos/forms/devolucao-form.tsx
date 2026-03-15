'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { fetchOpenEmprestimosForDevolucao } from '../client/devolucoes-open-selector-client';
import type { DevolucaoPayload } from '../schemas/emprestimo-schema';
import type { DevolucaoSelectorOption } from '../client/devolucoes-open-selector-client';

type DevolucaoFormProps = {
  onSubmit: (values: DevolucaoPayload) => Promise<void>;
  onCancel?: () => void;
};

export function DevolucaoForm({ onSubmit, onCancel }: DevolucaoFormProps) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<DevolucaoSelectorOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestSeqRef = useRef(0);

  const hasMore = page < totalPages;
  const isSubmitDisabled = !selectedId || options.length === 0 || submitting;

  useEffect(() => {
    setSelectedId('');
  }, [search]);

  useEffect(() => {
    const currentSeq = requestSeqRef.current + 1;
    requestSeqRef.current = currentSeq;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchOpenEmprestimosForDevolucao(1, search || undefined);
        if (currentSeq !== requestSeqRef.current) {
          return;
        }
        setOptions(result.items);
        setPage(result.page);
        setTotalPages(result.totalPages);
        setSelectedId((current) =>
          result.items.some((item) => item.value === current) ? current : '',
        );
      } catch {
        if (currentSeq === requestSeqRef.current) {
          setError('Nao foi possivel carregar emprestimos em aberto');
        }
      } finally {
        if (currentSeq === requestSeqRef.current) {
          setLoading(false);
        }
      }
    };

    void load();
  }, [search]);

  const selectedValue = useMemo(() => selectedId, [selectedId]);

  const loadMore = async () => {
    if (!hasMore || loading) {
      return;
    }

    const currentSeq = requestSeqRef.current;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchOpenEmprestimosForDevolucao(page + 1, search || undefined);
      if (currentSeq !== requestSeqRef.current) {
        return;
      }
      setOptions((current) => [...current, ...result.items]);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch {
      if (currentSeq === requestSeqRef.current) {
        setError('Nao foi possivel carregar emprestimos em aberto');
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <form
      className="devolucao-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!selectedValue) {
          return;
        }

        setSubmitting(true);

        try {
          await onSubmit({ emprestimoId: selectedValue });
        } catch {
          return;
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="form-field">
        <label htmlFor="devolucao-search">Buscar</label>
        <input
          id="devolucao-search"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          placeholder="Buscar emprestimo em aberto"
        />
      </div>

      <div className="form-field">
        <label htmlFor="emprestimoId">Emprestimo</label>
        <select
          id="emprestimoId"
          value={selectedValue}
          onChange={(event) => {
            setSelectedId(event.target.value);
          }}
        >
          <option value="">Selecione um emprestimo</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {options.length === 0 && !loading ? (
          <p role="status">Nao ha emprestimos em aberto para devolucao.</p>
        ) : null}
        {error ? <p role="alert">{error}</p> : null}
      </div>

      {hasMore ? (
        <button type="button" onClick={loadMore} disabled={loading}>
          Carregar mais
        </button>
      ) : null}

      <div className="modal-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitDisabled}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
