import { describe, expect, it } from 'vitest';
import { UsuarioMapper } from './usuario.mapper';
import { UsuarioOrmEntity } from './usuario.orm-entity';

describe('UsuarioMapper', () => {
  it('round-trip preserves all mappable fields', () => {
    const orm = new UsuarioOrmEntity();
    orm.id = 'user-1';
    orm.nome = 'Joao Silva';
    orm.email = 'joao@example.com';
    orm.senha_hash = 'hash123';
    orm.ativo = true;
    orm.created_at = new Date('2025-01-01');
    orm.updated_at = new Date('2025-06-01');

    const roundTripped = UsuarioMapper.toOrm(
      UsuarioMapper.toDomain({
        orm,
        empresaId: 'empresa-a',
        departamentoId: 'dept-1',
      }),
    );
    expect(roundTripped.id).toBe(orm.id);
    expect(roundTripped.nome).toBe(orm.nome);
    expect(roundTripped.email).toBe(orm.email);
    expect(roundTripped.senha_hash).toBe(orm.senha_hash);
    expect(roundTripped.ativo).toBe(orm.ativo);
  });
});
