import { describe, expect, it } from 'vitest';
import { usuarioListQuerySchema } from './usuario.schemas';

describe('usuarioListQuerySchema', () => {
  it('accepts only true|false for ativo', () => {
    expect(usuarioListQuerySchema.parse({ ativo: 'true' }).ativo).toBe(true);
    expect(usuarioListQuerySchema.parse({ ativo: 'false' }).ativo).toBe(false);
    expect(() => usuarioListQuerySchema.parse({ ativo: '1' })).toThrow();
  });
});
