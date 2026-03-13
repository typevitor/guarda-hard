"use client";

import { useState } from "react";

import { UsuarioForm } from "../forms/usuario-form";
import type { UsuarioPayload } from "../schemas/usuario-schema";

type UsuariosPageProps = {
  onSubmit: (values: UsuarioPayload) => Promise<void>;
};

export function UsuariosPage({ onSubmit }: UsuariosPageProps) {
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (values: UsuarioPayload): Promise<void> => {
    setStatus(null);

    try {
      await onSubmit(values);
      setStatus({ type: "success", message: "Usuario criado com sucesso" });
    } catch {
      setStatus({ type: "error", message: "Nao foi possivel criar usuario" });
      throw new Error("submit failed");
    }
  };

  return (
    <section className="panel-card" aria-label="Pagina de usuarios">
      <h2 className="panel-title">Usuarios</h2>
      <p className="panel-text">Cadastre usuarios e vincule cada um ao departamento.</p>
      <UsuarioForm onSubmit={handleSubmit} />
      {status ? <p role="status">{status.message}</p> : null}
    </section>
  );
}
