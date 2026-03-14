import { z } from 'zod';

const normalizedEmailSchema = z.string().trim().toLowerCase().email();

export const registerSchema = z
  .object({
    nome: z.string().trim().min(1),
    email: normalizedEmailSchema,
    senha: z.string().min(8),
    confirmarSenha: z.string().min(8),
    empresaId: z.string().uuid(),
  })
  .refine((payload) => payload.senha === payload.confirmarSenha, {
    message: 'Senha e confirmarSenha devem ser iguais',
    path: ['confirmarSenha'],
  });

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  senha: z.string().min(1),
});

export const selectEmpresaSchema = z.object({
  empresaId: z.string().uuid(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type SelectEmpresaDto = z.infer<typeof selectEmpresaSchema>;
