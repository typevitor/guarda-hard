import { describe, expect, it } from 'vitest';
import { Departamento } from './departamento.entity';

describe('Departamento domain entity', () => {
  it('creates departamento with generated UUID', () => {
    const dept = Departamento.create({ empresaId: 'empresa-a', nome: 'TI' });
    expect(dept.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dept.empresaId).toBe('empresa-a');
    expect(dept.nome).toBe('TI');
  });

  it('reconstitutes from props', () => {
    const dept = new Departamento({
      id: 'dept-1',
      empresaId: 'empresa-a',
      nome: 'RH',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-06-01'),
    });
    expect(dept.id).toBe('dept-1');
    expect(dept.nome).toBe('RH');
    expect(dept.createdAt).toEqual(new Date('2025-01-01'));
  });
});
