import { describe, expect, it } from 'vitest';
import { Usuario } from './usuario.entity';

describe('Usuario domain entity', () => {
  it('creates usuario with generated UUID and default ativo=true', () => {
    const user = Usuario.create({
      empresaId: 'empresa-a',
      departamentoId: 'dept-1',
      nome: 'Joao Silva',
      email: 'joao@example.com',
      senhaHash: 'hash123',
    });
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.empresaId).toBe('empresa-a');
    expect(user.departamentoId).toBe('dept-1');
    expect(user.nome).toBe('Joao Silva');
    expect(user.email).toBe('joao@example.com');
    expect(user.senhaHash).toBe('hash123');
    expect(user.ativo).toBe(true);
  });

  it('reconstitutes from props', () => {
    const user = new Usuario({
      id: 'user-1',
      empresaId: 'empresa-a',
      departamentoId: 'dept-1',
      nome: 'Maria',
      email: 'maria@example.com',
      senhaHash: 'hash456',
      ativo: false,
    });
    expect(user.id).toBe('user-1');
    expect(user.senhaHash).toBe('hash456');
    expect(user.ativo).toBe(false);
  });

  it('defaults departamentoId to null when not provided on create', () => {
    const user = Usuario.create({
      empresaId: 'empresa-a',
      nome: 'Sem departamento',
      email: 'sem-departamento@example.com',
    });

    expect(user.departamentoId).toBeNull();
  });
});
