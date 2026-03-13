import { describe, expect, it } from 'vitest';
import { HardwareMapper } from './hardware.mapper';
import { Hardware } from '../../domain/entities/hardware.entity';
import { HardwareOrmEntity } from './hardware.orm-entity';

describe('HardwareMapper', () => {
  const ormFixture = (): HardwareOrmEntity => {
    const orm = new HardwareOrmEntity();
    orm.id = 'hw-1';
    orm.empresa_id = 'empresa-a';
    orm.descricao = 'Notebook Dell';
    orm.marca = 'Dell';
    orm.modelo = 'Latitude 5520';
    orm.codigo_patrimonio = 'PAT-001';
    orm.funcionando = true;
    orm.descricao_problema = null;
    orm.livre = true;
    orm.version = 3;
    orm.created_at = new Date('2025-01-01');
    orm.updated_at = new Date('2025-06-01');
    return orm;
  };

  it('toDomain maps all fields with correct casing', () => {
    const domain = HardwareMapper.toDomain(ormFixture());
    expect(domain.id).toBe('hw-1');
    expect(domain.empresaId).toBe('empresa-a');
    expect(domain.descricao).toBe('Notebook Dell');
    expect(domain.marca).toBe('Dell');
    expect(domain.modelo).toBe('Latitude 5520');
    expect(domain.codigoPatrimonio).toBe('PAT-001');
    expect(domain.funcionando).toBe(true);
    expect(domain.descricaoProblema).toBeNull();
    expect(domain.livre).toBe(true);
    expect(domain.version).toBe(3);
    expect(domain.createdAt).toEqual(new Date('2025-01-01'));
    expect(domain.updatedAt).toEqual(new Date('2025-06-01'));
  });

  it('toOrm maps all fields with correct casing', () => {
    const domain = HardwareMapper.toDomain(ormFixture());
    const orm = HardwareMapper.toOrm(domain);
    expect(orm.id).toBe('hw-1');
    expect(orm.empresa_id).toBe('empresa-a');
    expect(orm.codigo_patrimonio).toBe('PAT-001');
    expect(orm.version).toBe(3);
  });

  it('round-trip preserves all mappable fields', () => {
    const original = ormFixture();
    const roundTripped = HardwareMapper.toOrm(
      HardwareMapper.toDomain(original),
    );
    expect(roundTripped.id).toBe(original.id);
    expect(roundTripped.empresa_id).toBe(original.empresa_id);
    expect(roundTripped.descricao).toBe(original.descricao);
    expect(roundTripped.marca).toBe(original.marca);
    expect(roundTripped.modelo).toBe(original.modelo);
    expect(roundTripped.codigo_patrimonio).toBe(original.codigo_patrimonio);
    expect(roundTripped.funcionando).toBe(original.funcionando);
    expect(roundTripped.descricao_problema).toBe(original.descricao_problema);
    expect(roundTripped.livre).toBe(original.livre);
    expect(roundTripped.version).toBe(original.version);
    // created_at and updated_at are intentionally NOT mapped in toOrm
  });
});
