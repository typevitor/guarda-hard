import { describe, expect, it } from 'vitest';
import { DomainEntity } from './domain-entity.base';

class TestEntity extends DomainEntity {
  constructor(props: {
    id: string;
    empresaId: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(props);
  }
}

describe('DomainEntity', () => {
  it('assigns id and empresaId from props', () => {
    const entity = new TestEntity({ id: 'abc', empresaId: 'emp-1' });
    expect(entity.id).toBe('abc');
    expect(entity.empresaId).toBe('emp-1');
  });

  it('defaults createdAt and updatedAt to current date', () => {
    const before = new Date();
    const entity = new TestEntity({ id: 'abc', empresaId: 'emp-1' });
    const after = new Date();
    expect(entity.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(entity.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(entity.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('uses provided createdAt and updatedAt', () => {
    const created = new Date('2025-01-01');
    const updated = new Date('2025-06-01');
    const entity = new TestEntity({
      id: 'abc',
      empresaId: 'emp-1',
      createdAt: created,
      updatedAt: updated,
    });
    expect(entity.createdAt).toEqual(created);
    expect(entity.updatedAt).toEqual(updated);
  });
});
