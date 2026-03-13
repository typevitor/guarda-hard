"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FilterBar } from "@/components/ui/filter-bar";
import { Modal } from "@/components/ui/modal";
import { PaginationControls } from "@/components/ui/pagination-controls";

import { DevolucaoForm } from "../forms/devolucao-form";
import type { DevolucoesListQuery } from "../schemas/devolucoes-list-query-schema";
import type { DevolucaoPayload } from "../schemas/emprestimo-schema";
import type { EmprestimoListResponse } from "../server/emprestimos-list-api";
import type { DevolucaoSelectorOption } from "../server/devolucoes-open-selector-api";
import { DevolucoesList } from "./devolucoes-list";

type DevolucaoPageProps = {
  onSubmit: (values: DevolucaoPayload) => Promise<void>;
  onLoadOpenEmprestimos: (
    page: number,
    search?: string,
  ) => Promise<{ items: DevolucaoSelectorOption[]; page: number; totalPages: number }>;
  list: EmprestimoListResponse;
  query: DevolucoesListQuery;
};

export function DevolucaoPage({
  onSubmit,
  onLoadOpenEmprestimos,
  list,
  query,
}: DevolucaoPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState(query);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const pushQuery = (nextQuery: DevolucoesListQuery): void => {
    const params = new URLSearchParams();
    params.set("page", String(nextQuery.page));
    params.set("status", "returned");
    if (nextQuery.search) {
      params.set("search", nextQuery.search);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = async (values: DevolucaoPayload): Promise<void> => {
    setModalError(null);

    try {
      await onSubmit(values);
      setIsModalOpen(false);
      setStatus({ type: "success", message: "Devolucao registrada com sucesso" });
      router.refresh();
    } catch {
      setModalError("Nao foi possivel registrar devolucao");
      throw new Error("submit failed");
    }
  };

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
            New
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
            status: "returned" as const,
          };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
        onClearFilters={() => {
          const nextQuery = { ...activeQuery, search: "", page: 1, status: "returned" as const };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
      />

      <DevolucoesList items={list.items} />

      <PaginationControls
        page={activeQuery.page}
        totalPages={Math.max(list.totalPages, 1)}
        onPageChange={(page) => {
          const nextQuery = { ...activeQuery, page, status: "returned" as const };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
      />

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Nova devolucao">
        {modalError ? <FeedbackBanner type="error" message={modalError} /> : null}
        <DevolucaoForm onSubmit={handleSubmit} loadOptions={onLoadOpenEmprestimos} />
      </Modal>
    </section>
  );
}
