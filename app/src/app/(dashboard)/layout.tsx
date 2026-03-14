import { redirect } from "next/navigation";

import { AppShell } from "../../components/layout/app-shell";
import { ApiError } from "../../lib/api/errors";
import { apiClient } from "../../lib/api/client";

type CurrentUser = {
  id: string;
  empresaId?: string;
};

async function assertPhaseBSession(): Promise<void> {
  try {
    const currentUser = await apiClient<CurrentUser>({
      path: "/auth/me",
      method: "GET",
      fallbackErrorMessage: "Nao foi possivel validar sessao",
    });

    if (!currentUser?.empresaId) {
      redirect("/select-company");
    }
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      redirect("/");
    }

    throw error;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await assertPhaseBSession();
  return <AppShell>{children}</AppShell>;
}
