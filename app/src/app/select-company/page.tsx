import { CompanySelectionPage } from "@/features/auth/components/company-selection-page";
import type { SelectEmpresaPayload } from "@/features/auth/schemas/auth-schema";
import {
  listMinhasEmpresasServer,
  selectEmpresaServer,
} from "@/features/auth/server/auth-api";

async function submitCompanySelection(values: SelectEmpresaPayload): Promise<void> {
  "use server";

  await selectEmpresaServer(values);
}

export default async function SelectCompanyRoute() {
  const empresas = await listMinhasEmpresasServer();

  return (
    <main className="auth-home-shell">
      <CompanySelectionPage empresas={empresas} onSubmit={submitCompanySelection} />
    </main>
  );
}
