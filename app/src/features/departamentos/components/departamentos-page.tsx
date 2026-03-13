"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FilterBar } from "@/components/ui/filter-bar";
import { Modal } from "@/components/ui/modal";
import { PaginationControls } from "@/components/ui/pagination-controls";

import {
  DepartamentoForm,
} from "../forms/departamento-form";
import type { DepartamentosListQuery } from "../schemas/departamentos-list-query-schema";
import type { DepartamentoPayload } from "../schemas/departamento-schema";
import type { DepartamentoListResponse } from "../server/departamentos-list-api";
import { DepartamentosList } from "./departamentos-list";

type DepartamentosPageProps = {
  onSubmit: (values: DepartamentoPayload) => Promise<void>;
  list: DepartamentoListResponse;
  query: DepartamentosListQuery;
};

export function DepartamentosPage({ onSubmit, list, query }: DepartamentosPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState(query);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const pushQuery = (nextQuery: DepartamentosListQuery): void => {
    const params = new URLSearchParams();
    params.set("page", String(nextQuery.page));
    if (nextQuery.search) {
      params.set("search", nextQuery.search);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = async (values: DepartamentoPayload): Promise<void> => {
    setModalError(null);

    try {
      await onSubmit(values);
      setIsModalOpen(false);
      setStatus({ type: "success", message: "Departamento criado com sucesso" });
      router.refresh();
    } catch {
      setModalError("Nao foi possivel criar departamento");
      throw new Error("submit failed");
    }
  };

  return (
    <section className="list-page" aria-label="Pagina de departamentos">
      <div className="list-page-header">
        <div>
          <h2 className="panel-title">Departamentos</h2>
          <p className="panel-text">Cadastre os departamentos disponiveis para vinculacao.</p>
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
            New
          </button>
        </div>
      </div>

      {status ? <FeedbackBanner type={status.type} message={status.message} /> : null}

      <FilterBar
        searchValue={activeQuery.search}
        searchPlaceholder="Buscar departamento"
        onSearchChange={(value) => {
          const nextQuery = { ...activeQuery, search: value, page: 1 };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
        onClearFilters={() => {
          const nextQuery = { ...activeQuery, search: "", page: 1 };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
      />

      <DepartamentosList items={list.items} />

      <PaginationControls
        page={activeQuery.page}
        totalPages={Math.max(list.totalPages, 1)}
        onPageChange={(page) => {
          const nextQuery = { ...activeQuery, page };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
      />

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Novo departamento">
        {modalError ? <FeedbackBanner type="error" message={modalError} /> : null}
        <DepartamentoForm onSubmit={handleSubmit} />
      </Modal>
    </section>
  );
}
