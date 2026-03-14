import { describe, expect, it } from 'vitest';
import { registerSchema } from './auth.schemas';

describe('auth schemas', () => {
  it('normalizes email with trim + lowercase', () => {
    const parsed = registerSchema.parse({
      nome: 'Usuario Teste',
      email: '  USER@Example.COM ',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    expect(parsed.email).toBe('user@example.com');
  });

  it('rejects when senha and confirmarSenha differ', () => {
    const result = registerSchema.safeParse({
      nome: 'Usuario Teste',
      email: 'user@example.com',
      senha: '12345678',
      confirmarSenha: '87654321',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    expect(result.success).toBe(false);
  });
});
