"use client";

import { useRouter } from "next/navigation";

import { CompanySelectionForm } from "../forms/company-selection-form";
import type { AuthEmpresa, SelectEmpresaPayload } from "../schemas/auth-schema";

type CompanySelectionPageProps = {
  empresas: AuthEmpresa[];
  onSubmit: (values: SelectEmpresaPayload) => Promise<void>;
};

export function CompanySelectionPage({ empresas, onSubmit }: CompanySelectionPageProps) {
  const router = useRouter();

  const handleSubmit = async (values: SelectEmpresaPayload): Promise<void> => {
    await onSubmit(values);
    router.push("/dashboard");
  };

  return (
    <section className="auth-home" aria-label="Selecao de empresa">
      <header className="auth-home-header">
        <h1 className="panel-title">Selecione a empresa</h1>
        <p className="panel-text">Escolha a empresa para continuar para o dashboard.</p>
      </header>

      <div className="auth-panel" role="region" aria-label="Formulario de selecao de empresa">
        <CompanySelectionForm empresas={empresas} onSubmit={handleSubmit} />
      </div>
    </section>
  );
}
