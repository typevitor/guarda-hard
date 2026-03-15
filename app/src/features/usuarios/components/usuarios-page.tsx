"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FilterBar } from "@/components/ui/filter-bar";
import { Modal } from "@/components/ui/modal";
import { PaginationControls } from "@/components/ui/pagination-controls";
import type { DepartamentoOption } from "@/features/departamentos/server/departamentos-options-api";

import { UsuarioForm } from "../forms/usuario-form";
import type { UsuariosListQuery } from "../schemas/usuarios-list-query-schema";
import type { UsuarioPayload } from "../schemas/usuario-schema";
import type { UsuarioListResponse } from "../server/usuarios-list-api";
import { UsuariosList } from "./usuarios-list";

type UsuariosPageProps = {
  onSubmit: (values: UsuarioPayload) => Promise<void>;
  list: UsuarioListResponse;
  query: UsuariosListQuery;
  departamentoOptions: DepartamentoOption[];
  departamentoOptionsError?: string | null;
};

export function UsuariosPage({
  onSubmit,
  list,
  query,
  departamentoOptions,
  departamentoOptionsError = null,
}: UsuariosPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState(query);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const pushQuery = (nextQuery: UsuariosListQuery): void => {
    const params = new URLSearchParams();
    params.set("page", String(nextQuery.page));
    if (nextQuery.search) {
      params.set("search", nextQuery.search);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = async (values: UsuarioPayload): Promise<void> => {
    setModalError(null);

    try {
      await onSubmit(values);
      setIsModalOpen(false);
      setStatus({ type: "success", message: "Usuario criado com sucesso" });
      router.refresh();
    } catch {
      setModalError("Nao foi possivel criar usuario");
      throw new Error("submit failed");
    }
  };

  return (
    <section className="list-page" aria-label="Pagina de usuarios">
      <div className="list-page-header">
        <div>
          <h2 className="panel-title">Usuarios</h2>
          <p className="panel-text">Cadastre usuarios e vincule cada um ao departamento.</p>
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
        searchPlaceholder="Buscar usuario"
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

      <UsuariosList items={list.items} />

      <PaginationControls
        page={activeQuery.page}
        totalPages={Math.max(list.totalPages, 1)}
        onPageChange={(page) => {
          const nextQuery = { ...activeQuery, page };
          setActiveQuery(nextQuery);
          pushQuery(nextQuery);
        }}
      />

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Novo usuario">
        {departamentoOptionsError ? (
          <FeedbackBanner type="error" message={departamentoOptionsError} />
        ) : null}
        {modalError ? <FeedbackBanner type="error" message={modalError} /> : null}
        <UsuarioForm
          onSubmit={handleSubmit}
          departamentoOptions={departamentoOptions}
          departamentoDisabled={Boolean(departamentoOptionsError)}
        />
      </Modal>
    </section>
  );
}
