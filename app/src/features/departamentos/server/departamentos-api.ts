import { apiClient } from "@/lib/api/client";

import {
  departamentoSchema,
  type DepartamentoPayload,
} from "../schemas/departamento-schema";

export async function createDepartamentoServer(payload: DepartamentoPayload): Promise<void> {
  const parsedPayload = departamentoSchema.parse(payload);

  await apiClient({
    path: "/departamentos",
    method: "POST",
    body: parsedPayload,
    responseType: "void",
    fallbackErrorMessage: "Nao foi possivel criar departamento",
  });
}
