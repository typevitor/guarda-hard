"use client";

import { useState } from "react";

import { DevolucaoForm } from "../forms/devolucao-form";
import type { DevolucaoPayload } from "../schemas/emprestimo-schema";

type DevolucaoPageProps = {
  onSubmit: (values: DevolucaoPayload) => Promise<void>;
};

export function DevolucaoPage({ onSubmit }: DevolucaoPageProps) {
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (values: DevolucaoPayload): Promise<void> => {
    setStatus(null);

    try {
      await onSubmit(values);
      setStatus({ type: "success", message: "Devolucao registrada com sucesso" });
    } catch {
      setStatus({ type: "error", message: "Nao foi possivel registrar devolucao" });
      throw new Error("submit failed");
    }
  };

  return (
    <section className="panel-card" aria-label="Pagina de devolucao">
      <h2 className="panel-title">Devolucao</h2>
      <p className="panel-text">Registre a devolucao de um hardware emprestado.</p>
      <DevolucaoForm onSubmit={handleSubmit} />
      {status ? <p role="status">{status.message}</p> : null}
    </section>
  );
}
