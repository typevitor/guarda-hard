import { apiClient } from "@/lib/api/client";

import { usuarioSchema, type UsuarioPayload } from "../schemas/usuario-schema";

export async function createUsuarioServer(payload: UsuarioPayload): Promise<void> {
  const parsedPayload = usuarioSchema.parse(payload);

  await apiClient({
    path: "/usuarios",
    method: "POST",
    body: parsedPayload,
    responseType: "void",
    fallbackErrorMessage: "Nao foi possivel criar usuario",
  });
}
