import { UsuariosPage } from "@/features/usuarios/components/usuarios-page";
import type { UsuarioPayload } from "@/features/usuarios/schemas/usuario-schema";
import { createUsuarioServer } from "@/features/usuarios/server/usuarios-api";

async function submitUsuario(values: UsuarioPayload): Promise<void> {
  "use server";

  await createUsuarioServer(values);
}

export default function UsuariosRoutePage() {
  return <UsuariosPage onSubmit={submitUsuario} />;
}
