"use client";

import { useState } from "react";

import { HardwareForm } from "../forms/hardware-form";
import type { HardwarePayload } from "../schemas/hardware-schema";

type HardwaresPageProps = {
  onSubmit: (values: HardwarePayload) => Promise<void>;
};

export function HardwaresPage({ onSubmit }: HardwaresPageProps) {
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (values: HardwarePayload): Promise<void> => {
    setStatus(null);

    try {
      await onSubmit(values);
      setStatus({ type: "success", message: "Hardware criado com sucesso" });
    } catch {
      setStatus({ type: "error", message: "Nao foi possivel criar hardware" });
      throw new Error("submit failed");
    }
  };

  return (
    <section className="panel-card" aria-label="Pagina de hardwares">
      <h2 className="panel-title">Hardwares</h2>
      <p className="panel-text">Cadastre ativos e acompanhe o patrimonio disponivel.</p>
      <HardwareForm onSubmit={handleSubmit} />
      {status ? <p role="status">{status.message}</p> : null}
    </section>
  );
}
