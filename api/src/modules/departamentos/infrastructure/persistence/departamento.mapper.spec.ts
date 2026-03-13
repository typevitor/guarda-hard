import { describe, expect, it } from 'vitest';
import { DepartamentoMapper } from './departamento.mapper';
import { DepartamentoOrmEntity } from './departamento.orm-entity';

describe('DepartamentoMapper', () => {
  it('round-trip preserves all mappable fields', () => {
    const orm = new DepartamentoOrmEntity();
    orm.id = 'dept-1';
    orm.empresa_id = 'empresa-a';
    orm.nome = 'TI';
    orm.created_at = new Date('2025-01-01');
    orm.updated_at = new Date('2025-06-01');

    const roundTripped = DepartamentoMapper.toOrm(
      DepartamentoMapper.toDomain(orm),
    );
    expect(roundTripped.id).toBe(orm.id);
    expect(roundTripped.empresa_id).toBe(orm.empresa_id);
    expect(roundTripped.nome).toBe(orm.nome);
  });
});
