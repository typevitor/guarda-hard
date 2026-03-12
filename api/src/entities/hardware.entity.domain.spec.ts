import { describe, expect, it } from 'vitest';
import { Hardware } from './hardware.entity';
import { DescricaoProblemaObrigatoriaError } from './domain.errors';

describe('Hardware domain', () => {
  it('marks hardware as broken and unavailable with problem description', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: true,
      livre: true,
      descricao_problema: null,
    });

    hardware.marcarDefeito('nao liga');

    expect(hardware.funcionando).toBe(false);
    expect(hardware.livre).toBe(false);
    expect(hardware.descricao_problema).toBe('nao liga');
  });

  it('requires non-empty problem description', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: true,
      livre: true,
      descricao_problema: null,
    });

    expect(() => hardware.marcarDefeito('   ')).toThrow(
      DescricaoProblemaObrigatoriaError,
    );
  });

  it('repairs hardware and returns it to available state', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: false,
      livre: false,
      descricao_problema: 'nao liga',
    });

    hardware.consertar();

    expect(hardware.funcionando).toBe(true);
    expect(hardware.livre).toBe(true);
    expect(hardware.descricao_problema).toBeNull();
  });
});
