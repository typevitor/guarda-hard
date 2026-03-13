import { EmprestimoPage } from "@/features/emprestimos/components/emprestimo-page";
import type { EmprestimoPayload } from "@/features/emprestimos/schemas/emprestimo-schema";
import { createEmprestimoServer } from "@/features/emprestimos/server/emprestimos-api";

async function submitEmprestimo(values: EmprestimoPayload): Promise<void> {
  "use server";

  await createEmprestimoServer(values);
}

export default function EmprestimoRoutePage() {
  return <EmprestimoPage onSubmit={submitEmprestimo} />;
}
