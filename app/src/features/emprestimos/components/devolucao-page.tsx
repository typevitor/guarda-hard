'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { FilterBar } from '@/components/ui/filter-bar';
import { Modal } from '@/components/ui/modal';
import { PaginationControls } from '@/components/ui/pagination-controls';

import { DevolucaoForm } from '../forms/devolucao-form';
import type { DevolucoesListQuery } from '../schemas/devolucoes-list-query-schema';
import type { DevolucaoPayload } from '../schemas/emprestimo-schema';
import type { EmprestimoListResponse } from '../server/emprestimos-list-api';
import { DevolucoesList } from './devolucoes-list';

type DevolucaoPresetId = 'all' | 'today' | 'week' | 'month';

const parseDate = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const datePart = value.slice(0, 10);
  const [yearText, monthText, dayText] = datePart.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const startOfWeek = (date: Date): Date => {
  const start = new Date(date);
  const offset = (date.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(date.getDate() - offset);
  return start;
};

const endOfWeek = (date: Date): Date => {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const startOfMonth = (date: Date): Date => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const endOfMonth = (date: Date): Date => {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
};

type DevolucaoPageProps = {
  onSubmit: (values: DevolucaoPayload) => Promise<void>;
  list: EmprestimoListResponse;
  query: DevolucoesListQuery;
};

export function DevolucaoPage({ onSubmit, list, query }: DevolucaoPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState(query);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<DevolucaoPresetId>('all');
  const hasDevolucaoDates = list.items.some((item) => parseDate(item.dataDevolucao) !== null);

  const devolucaoPresets: { id: DevolucaoPresetId; label: string; disabled?: boolean }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'today', label: 'Devolvidos hoje', disabled: !hasDevolucaoDates },
    { id: 'week', label: 'Esta semana', disabled: !hasDevolucaoDates },
    { id: 'month', label: 'Este mes', disabled: !hasDevolucaoDates },
  ];

  const pushQuery = (nextQuery: DevolucoesListQuery): void => {
    const params = new URLSearchParams();
    params.set('page', String(nextQuery.page));
    params.set('status', 'returned');
    if (nextQuery.search) {
      params.set('search', nextQuery.search);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = async (values: DevolucaoPayload): Promise<void> => {
    setModalError(null);

    try {
      await onSubmit(values);
      setIsModalOpen(false);
      setStatus({ type: 'success', message: 'Devolucao registrada com sucesso' });
      router.refresh();
    } catch (error) {
      setModalError('Nao foi possivel registrar devolucao');
      throw error;
    }
  };

  const applyPreset = (presetId: DevolucaoPresetId): void => {
    const nextQuery = {
      ...activeQuery,
      page: 1,
      status: 'returned' as const,
      retiradaFrom: undefined,
      retiradaTo: undefined,
      devolucaoFrom: undefined,
      devolucaoTo: undefined,
    };

    setActivePresetId(presetId);
    setActiveQuery(nextQuery);
    pushQuery(nextQuery);
  };

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const filteredItems = list.items.filter((item) => {
    if (activePresetId === 'all') {
      return true;
    }

    const devolucaoDate = parseDate(item.dataDevolucao);
    if (!devolucaoDate) {
      return false;
    }

    if (activePresetId === 'today') {
      return isSameDay(devolucaoDate, now);
    }

    if (activePresetId === 'week') {
      return devolucaoDate >= weekStart && devolucaoDate <= weekEnd;
    }

    return devolucaoDate >= monthStart && devolucaoDate <= monthEnd;
  });

  return (
    <section className="list-page" aria-label="Pagina de devolucao">
      <div className="list-page-header">
        <div>
          <h2 className="panel-title">Devolucao</h2>
          <p className="panel-text">Registre a devolucao de um hardware emprestado.</p>
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
            Nova devolucao
          </button>
        </div>
      </div>

      {status ? <FeedbackBanner type={status.type} message={status.message} /> : null}

      <FilterBar
        searchValue={activeQuery.search}
        searchPlaceholder="Buscar devolucao"
        onSearchChange={(value) => {
          const nextQuery = {
            ...activeQuery,
            search: value,
            page: 1,
            status: 'returned' as const,
          };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
        onClearFilters={() => {
          const nextQuery = {
            ...activeQuery,
            search: '',
            page: 1,
            status: 'returned' as const,
            retiradaFrom: undefined,
            retiradaTo: undefined,
            devolucaoFrom: undefined,
            devolucaoTo: undefined,
          };
          setActivePresetId('all');
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
        presets={devolucaoPresets}
        activePresetId={activePresetId}
        onPresetChange={(presetId) => {
          applyPreset(presetId as DevolucaoPresetId);
        }}
      />

      <DevolucoesList items={filteredItems} />

      <PaginationControls
        page={activeQuery.page}
        totalPages={Math.max(list.totalPages, 1)}
        onPageChange={(page) => {
          const nextQuery = { ...activeQuery, page, status: 'returned' as const };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
      />

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Nova devolucao">
        {modalError ? <FeedbackBanner type="error" message={modalError} /> : null}
        <DevolucaoForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </section>
  );
}
