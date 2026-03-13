"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FilterBar } from "@/components/ui/filter-bar";
import { Modal } from "@/components/ui/modal";
import { PaginationControls } from "@/components/ui/pagination-controls";

import { HardwareForm } from "../forms/hardware-form";
import type { HardwaresListQuery } from "../schemas/hardwares-list-query-schema";
import type { HardwarePayload } from "../schemas/hardware-schema";
import type { HardwareListResponse } from "../server/hardwares-list-api";
import { HardwaresList } from "./hardwares-list";

type HardwaresPageProps = {
  onSubmit: (values: HardwarePayload) => Promise<void>;
  list: HardwareListResponse;
  query: HardwaresListQuery;
};

export function HardwaresPage({ onSubmit, list, query }: HardwaresPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState(query);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const pushQuery = (nextQuery: HardwaresListQuery): void => {
    const params = new URLSearchParams();
    params.set("page", String(nextQuery.page));
    if (nextQuery.search) {
      params.set("search", nextQuery.search);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = async (values: HardwarePayload): Promise<void> => {
    setModalError(null);

    try {
      await onSubmit(values);
      setIsModalOpen(false);
      setStatus({ type: "success", message: "Hardware criado com sucesso" });
      router.refresh();
    } catch {
      setModalError("Nao foi possivel criar hardware");
      throw new Error("submit failed");
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
            New
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
          const nextQuery = { ...activeQuery, search: "", page: 1 };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
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
        <HardwareForm onSubmit={handleSubmit} />
      </Modal>
    </section>
  );
}
