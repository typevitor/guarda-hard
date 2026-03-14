import { apiClient } from "@/lib/api/client";

import {
  authEmpresasResponseSchema,
  loginSchema,
  registerBaseSchema,
  selectEmpresaSchema,
  type AuthEmpresa,
  type LoginPayload,
  type RegisterPayload,
  type SelectEmpresaPayload,
} from "../schemas/auth-schema";

export async function listAuthEmpresasServer(): Promise<AuthEmpresa[]> {
  const payload = await apiClient({
    path: "/auth/empresas",
    method: "GET",
    fallbackErrorMessage: "Nao foi possivel carregar empresas",
  });

  const parsed = authEmpresasResponseSchema.parse(payload);
  return parsed.items;
}

export async function loginServer(payload: LoginPayload): Promise<void> {
  const parsedPayload = loginSchema.parse(payload);

  await apiClient({
    path: "/auth/login",
    method: "POST",
    body: parsedPayload,
    responseType: "void",
    fallbackErrorMessage: "Nao foi possivel entrar",
  });
}

export async function registerServer(payload: RegisterPayload): Promise<void> {
  const parsedPayload = registerBaseSchema.parse(payload);

  await apiClient({
    path: "/auth/register",
    method: "POST",
    body: parsedPayload,
    responseType: "void",
    fallbackErrorMessage: "Nao foi possivel registrar",
  });
}

export async function listMinhasEmpresasServer(): Promise<AuthEmpresa[]> {
  const payload = await apiClient({
    path: "/auth/minhas-empresas",
    method: "GET",
    fallbackErrorMessage: "Nao foi possivel carregar empresas",
  });

  const parsed = authEmpresasResponseSchema.parse(payload);
  return parsed.items;
}

export async function selectEmpresaServer(payload: SelectEmpresaPayload): Promise<void> {
  const parsedPayload = selectEmpresaSchema.parse(payload);

  await apiClient({
    path: "/auth/select-empresa",
    method: "POST",
    body: parsedPayload,
    responseType: "void",
    fallbackErrorMessage: "Nao foi possivel selecionar empresa",
  });
}
