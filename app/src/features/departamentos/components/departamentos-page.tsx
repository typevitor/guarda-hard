"use client";

import { useState } from "react";

import {
  DepartamentoForm,
  type DepartamentoFormValues,
} from "../forms/departamento-form";
import { createDepartamento } from "../server/departamentos-api";

export function DepartamentosPage() {
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (values: DepartamentoFormValues) => {
    await createDepartamento(values);
    setStatus("Departamento criado com sucesso");
  };

  return (
    <section className="panel-card" aria-label="Pagina de departamentos">
      <h2 className="panel-title">Departamentos</h2>
      <p className="panel-text">Cadastre os departamentos disponiveis para vinculacao.</p>
      <DepartamentoForm onSubmit={handleSubmit} />
      {status ? <p>{status}</p> : null}
    </section>
  );
}
