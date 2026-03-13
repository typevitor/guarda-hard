import { describe, expect, it } from 'vitest';
import { EmprestimoMapper } from './emprestimo.mapper';
import { EmprestimoOrmEntity } from './emprestimo.orm-entity';

describe('EmprestimoMapper', () => {
  const ormFixture = (): EmprestimoOrmEntity => {
    const orm = new EmprestimoOrmEntity();
    orm.id = 'emp-1';
    orm.empresa_id = 'empresa-a';
    orm.usuario_id = 'user-1';
    orm.hardware_id = 'hw-1';
    orm.data_retirada = new Date('2026-03-12');
    orm.data_devolucao = null;
    orm.created_at = new Date('2025-01-01');
    orm.updated_at = new Date('2025-06-01');
    return orm;
  };

  it('toDomain maps all fields', () => {
    const domain = EmprestimoMapper.toDomain(ormFixture());
    expect(domain.id).toBe('emp-1');
    expect(domain.empresaId).toBe('empresa-a');
    expect(domain.usuarioId).toBe('user-1');
    expect(domain.hardwareId).toBe('hw-1');
    expect(domain.dataDevolucao).toBeNull();
  });

  it('round-trip preserves all mappable fields', () => {
    const original = ormFixture();
    const roundTripped = EmprestimoMapper.toOrm(
      EmprestimoMapper.toDomain(original),
    );
    expect(roundTripped.id).toBe(original.id);
    expect(roundTripped.empresa_id).toBe(original.empresa_id);
    expect(roundTripped.usuario_id).toBe(original.usuario_id);
    expect(roundTripped.hardware_id).toBe(original.hardware_id);
    expect(roundTripped.data_retirada).toEqual(original.data_retirada);
    expect(roundTripped.data_devolucao).toBe(original.data_devolucao);
  });
});
