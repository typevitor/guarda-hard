import { DepartamentosPage } from "@/features/departamentos/components/departamentos-page";
import type { DepartamentoPayload } from "@/features/departamentos/schemas/departamento-schema";
import { createDepartamentoServer } from "@/features/departamentos/server/departamentos-api";

async function submitDepartamento(values: DepartamentoPayload): Promise<void> {
  "use server";

  await createDepartamentoServer(values);
}

export default function DepartamentosRoutePage() {
  return <DepartamentosPage onSubmit={submitDepartamento} />;
}
