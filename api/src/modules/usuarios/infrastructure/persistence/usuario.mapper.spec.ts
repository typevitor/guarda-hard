import { describe, expect, it } from 'vitest';
import { UsuarioMapper } from './usuario.mapper';
import { UsuarioOrmEntity } from './usuario.orm-entity';

describe('UsuarioMapper', () => {
  it('round-trip preserves all mappable fields', () => {
    const orm = new UsuarioOrmEntity();
    orm.id = 'user-1';
    orm.empresa_id = 'empresa-a';
    orm.departamento_id = 'dept-1';
    orm.nome = 'Joao Silva';
    orm.email = 'joao@example.com';
    orm.ativo = true;
    orm.created_at = new Date('2025-01-01');
    orm.updated_at = new Date('2025-06-01');

    const roundTripped = UsuarioMapper.toOrm(UsuarioMapper.toDomain(orm));
    expect(roundTripped.id).toBe(orm.id);
    expect(roundTripped.empresa_id).toBe(orm.empresa_id);
    expect(roundTripped.departamento_id).toBe(orm.departamento_id);
    expect(roundTripped.nome).toBe(orm.nome);
    expect(roundTripped.email).toBe(orm.email);
    expect(roundTripped.ativo).toBe(orm.ativo);
  });
});
