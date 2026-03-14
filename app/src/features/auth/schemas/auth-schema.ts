import { z } from "zod";

const normalizedEmailSchema = z.string().trim().toLowerCase().email("Email invalido");

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  senha: z.string().min(1, "Senha e obrigatoria"),
});

export const registerBaseSchema = z
  .object({
    nome: z.string().trim().min(1, "Nome e obrigatorio"),
    email: normalizedEmailSchema,
    senha: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
    confirmarSenha: z.string().min(8, "Confirmar senha deve ter no minimo 8 caracteres"),
    empresaId: z.string().trim().min(1, "Selecione uma empresa valida"),
  })
  .refine((payload) => payload.senha === payload.confirmarSenha, {
    message: "Senha e confirmar senha devem ser iguais",
    path: ["confirmarSenha"],
  });

export function createRegisterSchema(allowedEmpresaIds: string[]) {
  return registerBaseSchema.refine((payload) => allowedEmpresaIds.includes(payload.empresaId), {
    message: "Selecione uma empresa valida",
    path: ["empresaId"],
  });
}

export const authEmpresaSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1),
});

export const authEmpresasResponseSchema = z.object({
  items: z.array(authEmpresaSchema),
});

export const selectEmpresaSchema = z.object({
  empresaId: z.string().uuid(),
});

export function createSelectEmpresaSchema(allowedEmpresaIds: string[]) {
  return selectEmpresaSchema.refine((payload) => allowedEmpresaIds.includes(payload.empresaId), {
    message: "Selecione uma empresa valida",
    path: ["empresaId"],
  });
}

export type LoginPayload = z.infer<typeof loginSchema>;
export type RegisterPayload = z.infer<typeof registerBaseSchema>;
export type AuthEmpresa = z.infer<typeof authEmpresaSchema>;
export type SelectEmpresaPayload = z.infer<typeof selectEmpresaSchema>;
