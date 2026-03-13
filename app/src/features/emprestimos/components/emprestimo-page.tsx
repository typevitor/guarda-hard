"use client";

import { useState } from "react";

import { EmprestimoForm } from "../forms/emprestimo-form";
import type { EmprestimoPayload } from "../schemas/emprestimo-schema";

type EmprestimoPageProps = {
  onSubmit: (values: EmprestimoPayload) => Promise<void>;
};

export function EmprestimoPage({ onSubmit }: EmprestimoPageProps) {
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (values: EmprestimoPayload): Promise<void> => {
    setStatus(null);

    try {
      await onSubmit(values);
      setStatus({ type: "success", message: "Emprestimo registrado com sucesso" });
    } catch {
      setStatus({ type: "error", message: "Nao foi possivel registrar emprestimo" });
      throw new Error("submit failed");
    }
  };

  return (
    <section className="panel-card" aria-label="Pagina de emprestimo">
      <h2 className="panel-title">Emprestimo</h2>
      <p className="panel-text">Registre a retirada de hardware por usuario.</p>
      <EmprestimoForm onSubmit={handleSubmit} />
      {status ? <p role="status">{status.message}</p> : null}
    </section>
  );
}
