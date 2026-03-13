"use client";

import { useState } from "react";

import {
  DepartamentoForm,
} from "../forms/departamento-form";
import type { DepartamentoPayload } from "../schemas/departamento-schema";

type DepartamentosPageProps = {
  onSubmit: (values: DepartamentoPayload) => Promise<void>;
};

export function DepartamentosPage({ onSubmit }: DepartamentosPageProps) {
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (values: DepartamentoPayload): Promise<void> => {
    setStatus(null);

    try {
      await onSubmit(values);
      setStatus({ type: "success", message: "Departamento criado com sucesso" });
    } catch {
      setStatus({ type: "error", message: "Nao foi possivel criar departamento" });
      throw new Error("submit failed");
    }
  };

  return (
    <section className="panel-card" aria-label="Pagina de departamentos">
      <h2 className="panel-title">Departamentos</h2>
      <p className="panel-text">Cadastre os departamentos disponiveis para vinculacao.</p>
      <DepartamentoForm onSubmit={handleSubmit} />
      {status ? <p role="status">{status.message}</p> : null}
    </section>
  );
}
