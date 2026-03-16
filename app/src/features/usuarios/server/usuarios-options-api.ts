import { z } from "zod";

import { apiClient } from "@/lib/api/client";

const usuarioOptionSchema = z.object({
  id: z.string(),
  nome: z.string(),
});

const usuarioOptionsSchema = z.array(usuarioOptionSchema);

export type UsuarioOption = z.infer<typeof usuarioOptionSchema>;

export async function listUsuarioOptionsServer(): Promise<UsuarioOption[]> {
  const payload = await apiClient({
    path: "/usuarios/options",
    method: "GET",
    fallbackErrorMessage: "Nao foi possivel carregar usuarios",
  });

  return usuarioOptionsSchema.parse(payload);
}
