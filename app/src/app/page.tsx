import { AuthPage } from "@/features/auth/components/auth-page";
import type { LoginPayload, RegisterPayload } from "@/features/auth/schemas/auth-schema";
import {
  listAuthEmpresasServer,
  loginServer,
  registerServer,
} from "@/features/auth/server/auth-api";

async function submitLogin(values: LoginPayload): Promise<void> {
  "use server";

  await loginServer(values);
}

async function submitRegister(values: RegisterPayload): Promise<void> {
  "use server";

  await registerServer(values);
}

export default async function Home() {
  const empresas = await listAuthEmpresasServer();

  return (
    <main className="auth-home-shell">
      <AuthPage
        empresas={empresas}
        onLoginSubmit={submitLogin}
        onRegisterSubmit={submitRegister}
      />
    </main>
  );
}
