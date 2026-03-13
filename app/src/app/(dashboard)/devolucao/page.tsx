import { DevolucaoPage } from "@/features/emprestimos/components/devolucao-page";
import type { DevolucaoPayload } from "@/features/emprestimos/schemas/emprestimo-schema";
import { createDevolucaoServer } from "@/features/emprestimos/server/emprestimos-api";

async function submitDevolucao(values: DevolucaoPayload): Promise<void> {
  "use server";

  await createDevolucaoServer(values);
}

export default function DevolucaoRoutePage() {
  return <DevolucaoPage onSubmit={submitDevolucao} />;
}
