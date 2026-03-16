'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { FilterBar } from '@/components/ui/filter-bar';
import { Modal } from '@/components/ui/modal';
import { PaginationControls } from '@/components/ui/pagination-controls';

import { HardwareForm } from '../forms/hardware-form';
import type { HardwaresListQuery } from '../schemas/hardwares-list-query-schema';
import type { HardwarePayload } from '../schemas/hardware-schema';
import type { HardwareListResponse } from '../server/hardwares-list-api';
import { HardwaresList } from './hardwares-list';

type HardwarePresetId = 'all' | 'available' | 'inUse' | 'broken';

const hardwarePresets: { id: HardwarePresetId; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'available', label: 'Disponiveis' },
  { id: 'inUse', label: 'Em uso' },
  { id: 'broken', label: 'Com defeito' },
];

const resolveActivePreset = (query: HardwaresListQuery): HardwarePresetId => {
  if (query.funcionando === false) {
    return 'broken';
  }

  if (query.livre === true) {
    return 'available';
  }

  if (query.livre === false) {
    return 'inUse';
  }

  return 'all';
};

type HardwaresPageProps = {
  onSubmit: (values: HardwarePayload) => Promise<{ ok: true } | { ok: false; status?: number; message: string }>;
  list: HardwareListResponse;
  query: HardwaresListQuery;
};

type HardwareSubmitError = {
  status?: number;
  message?: string;
};

function resolveCreateHardwareErrorMessage(error: unknown): string {
  const { status, message } = (error ?? {}) as HardwareSubmitError;

  if (status === 400) {
    return message?.trim() || 'Dados invalidos. Revise os campos obrigatorios e tente novamente.';
  }

  if (status === 401 || status === 403) {
    return 'Sua sessao nao permite criar hardware nesta empresa. Entre novamente.';
  }

  return message?.trim() || 'Nao foi possivel criar hardware';
}

export function HardwaresPage({ onSubmit, list, query }: HardwaresPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState(query);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const activePresetId = resolveActivePreset(activeQuery);

  useEffect(() => {
    setActiveQuery(query);
  }, [query]);

  const pushQuery = (nextQuery: HardwaresListQuery): void => {
    const params = new URLSearchParams();
    params.set('page', String(nextQuery.page));
    if (nextQuery.search) {
      params.set('search', nextQuery.search);
    }
    if (nextQuery.livre !== undefined) {
      params.set('livre', String(nextQuery.livre));
    }
    if (nextQuery.funcionando !== undefined) {
      params.set('funcionando', String(nextQuery.funcionando));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const applyPreset = (presetId: HardwarePresetId): void => {
    const baseQuery = {
      ...activeQuery,
      page: 1,
      livre: undefined,
      funcionando: undefined,
    };

    const nextQuery =
      presetId === 'available'
        ? { ...baseQuery, livre: true }
        : presetId === 'inUse'
          ? { ...baseQuery, livre: false }
          : presetId === 'broken'
            ? { ...baseQuery, funcionando: false }
            : baseQuery;

    setActiveQuery(nextQuery);
    pushQuery(nextQuery);
  };

  const handleSubmit = async (values: HardwarePayload): Promise<void> => {
    setModalError(null);

    try {
      const result = await onSubmit(values);
      if (!result.ok) {
        const mappedMessage = resolveCreateHardwareErrorMessage(result);
        setModalError(mappedMessage);
        throw Object.assign(new Error(mappedMessage), { status: result.status });
      }

      setIsModalOpen(false);
      setStatus({ type: 'success', message: 'Hardware criado com sucesso' });
      router.refresh();
    } catch (error) {
      setModalError(resolveCreateHardwareErrorMessage(error));
      throw error;
    }
  };

  return (
    <section className="list-page" aria-label="Pagina de hardwares">
      <div className="list-page-header">
        <div>
          <h2 className="panel-title">Hardwares</h2>
          <p className="panel-text">Cadastre ativos e acompanhe o patrimonio disponivel.</p>
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
            Novo hardware
          </button>
        </div>
      </div>

      {status ? <FeedbackBanner type={status.type} message={status.message} /> : null}

      <FilterBar
        searchValue={activeQuery.search}
        searchPlaceholder="Buscar hardware"
        onSearchChange={(value) => {
          const nextQuery = { ...activeQuery, search: value, page: 1 };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
        onClearFilters={() => {
          const nextQuery = {
            ...activeQuery,
            search: '',
            page: 1,
            livre: undefined,
            funcionando: undefined,
          };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
        presets={hardwarePresets}
        activePresetId={activePresetId}
        onPresetChange={(presetId) => {
          applyPreset(presetId as HardwarePresetId);
        }}
      />

      <HardwaresList items={list.items} />

      <PaginationControls
        page={activeQuery.page}
        totalPages={Math.max(list.totalPages, 1)}
        onPageChange={(page) => {
          const nextQuery = { ...activeQuery, page };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
      />

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Novo hardware">
        {modalError ? <FeedbackBanner type="error" message={modalError} /> : null}
        <HardwareForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </section>
  );
}
