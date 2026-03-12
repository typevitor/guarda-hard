import { describe, expect, it } from 'vitest';
import { Usuario } from './usuario.entity';

describe('Usuario domain entity', () => {
  it('creates usuario with generated UUID and default ativo=true', () => {
    const user = Usuario.create({
      empresaId: 'empresa-a',
      departamentoId: 'dept-1',
      nome: 'Joao Silva',
      email: 'joao@example.com',
    });
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.empresaId).toBe('empresa-a');
    expect(user.departamentoId).toBe('dept-1');
    expect(user.nome).toBe('Joao Silva');
    expect(user.email).toBe('joao@example.com');
    expect(user.ativo).toBe(true);
  });

  it('reconstitutes from props', () => {
    const user = new Usuario({
      id: 'user-1',
      empresaId: 'empresa-a',
      departamentoId: 'dept-1',
      nome: 'Maria',
      email: 'maria@example.com',
      ativo: false,
    });
    expect(user.id).toBe('user-1');
    expect(user.ativo).toBe(false);
  });
});
