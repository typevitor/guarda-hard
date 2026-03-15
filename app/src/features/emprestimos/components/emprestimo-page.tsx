'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { FilterBar } from '@/components/ui/filter-bar';
import { Modal } from '@/components/ui/modal';
import { PaginationControls } from '@/components/ui/pagination-controls';

import { EmprestimoForm } from '../forms/emprestimo-form';
import type { EmprestimosListQuery } from '../schemas/emprestimos-list-query-schema';
import type { EmprestimoPayload } from '../schemas/emprestimo-schema';
import type { EmprestimoListResponse } from '../server/emprestimos-list-api';
import { EmprestimosList } from './emprestimos-list';

type EmprestimoPresetId = 'all' | 'open' | 'dueToday' | 'overdue';

const emprestimoPresets: { id: EmprestimoPresetId; label: string; disabled?: boolean }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'open', label: 'Abertos' },
  { id: 'dueToday', label: 'Vencendo hoje', disabled: true },
  { id: 'overdue', label: 'Atrasados', disabled: true },
];

type EmprestimoPageProps = {
  onSubmit: (values: EmprestimoPayload) => Promise<void>;
  list: EmprestimoListResponse;
  query: EmprestimosListQuery;
};

export function EmprestimoPage({ onSubmit, list, query }: EmprestimoPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState(query);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<EmprestimoPresetId>('all');

  const pushQuery = (nextQuery: EmprestimosListQuery): void => {
    const params = new URLSearchParams();
    params.set('page', String(nextQuery.page));
    params.set('status', 'open');
    if (nextQuery.search) {
      params.set('search', nextQuery.search);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = async (values: EmprestimoPayload): Promise<void> => {
    setModalError(null);

    try {
      await onSubmit(values);
      setIsModalOpen(false);
      setStatus({ type: 'success', message: 'Emprestimo registrado com sucesso' });
      router.refresh();
    } catch (error) {
      setModalError('Nao foi possivel registrar emprestimo');
      throw error;
    }
  };

  const applyPreset = (presetId: EmprestimoPresetId): void => {
    const nextQuery = {
      ...activeQuery,
      page: 1,
      status: 'open' as const,
      retiradaFrom: undefined,
      retiradaTo: undefined,
    };

    setActivePresetId(presetId);
    setActiveQuery(nextQuery);
    pushQuery(nextQuery);
  };

  return (
    <section className="list-page" aria-label="Pagina de emprestimo">
      <div className="list-page-header">
        <div>
          <h2 className="panel-title">Emprestimo</h2>
          <p className="panel-text">Registre a retirada de hardware por usuario.</p>
        </div>
        <div className="list-page-header-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setModalError(null);
              setIsModalOpen(true);
            }}
          >
            Novo emprestimo
          </button>
        </div>
      </div>

      {status ? <FeedbackBanner type={status.type} message={status.message} /> : null}

      <FilterBar
        searchValue={activeQuery.search}
        searchPlaceholder="Buscar emprestimo"
        onSearchChange={(value) => {
          const nextQuery = { ...activeQuery, search: value, page: 1, status: 'open' as const };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
        onClearFilters={() => {
          const nextQuery = {
            ...activeQuery,
            search: '',
            page: 1,
            status: 'open' as const,
            retiradaFrom: undefined,
            retiradaTo: undefined,
          };
          setActivePresetId('all');
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
        presets={emprestimoPresets}
        activePresetId={activePresetId}
        onPresetChange={(presetId) => {
          applyPreset(presetId as EmprestimoPresetId);
        }}
      />

      <EmprestimosList items={list.items} />

      <PaginationControls
        page={activeQuery.page}
        totalPages={Math.max(list.totalPages, 1)}
        onPageChange={(page) => {
          const nextQuery = { ...activeQuery, page, status: 'open' as const };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
      />

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Novo emprestimo">
        {modalError ? <FeedbackBanner type="error" message={modalError} /> : null}
        <EmprestimoForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </section>
  );
}
