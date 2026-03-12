import { describe, expect, it } from 'vitest';
import { Hardware } from './hardware.entity';
import { HardwareNaoDisponivelError } from '../errors/hardware-nao-disponivel.error';
import { HardwareDefeituosoError } from '../errors/hardware-defeituoso.error';
import { DescricaoProblemaObrigatoriaError } from '../errors/descricao-problema-obrigatoria.error';
import { DomainError } from '../../../../shared/domain/domain-error.base';

function makeHardware(
  overrides: Partial<import('./hardware.entity').HardwareProps> = {},
): Hardware {
  return new Hardware({
    id: 'hw-1',
    empresaId: 'empresa-a',
    descricao: 'Notebook Dell',
    marca: 'Dell',
    modelo: 'Latitude 5520',
    codigoPatrimonio: 'PAT-001',
    funcionando: true,
    descricaoProblema: null,
    livre: true,
    version: 1,
    ...overrides,
  });
}

describe('Hardware domain entity', () => {
  describe('create factory', () => {
    it('creates hardware with generated UUID and default values', () => {
      const hw = Hardware.create({
        empresaId: 'empresa-a',
        descricao: 'Notebook Dell',
        marca: 'Dell',
        modelo: 'Latitude 5520',
        codigoPatrimonio: 'PAT-001',
      });
      expect(hw.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(hw.empresaId).toBe('empresa-a');
      expect(hw.funcionando).toBe(true);
      expect(hw.livre).toBe(true);
      expect(hw.descricaoProblema).toBeNull();
      expect(hw.version).toBe(0);
    });
  });

  describe('emprestar', () => {
    it('marks hardware as not free', () => {
      const hw = makeHardware();
      hw.emprestar();
      expect(hw.livre).toBe(false);
    });

    it('rejects when hardware is broken', () => {
      const hw = makeHardware({ funcionando: false });
      expect(() => hw.emprestar()).toThrow(HardwareDefeituosoError);
    });

    it('rejects when hardware is already occupied', () => {
      const hw = makeHardware({ livre: false });
      expect(() => hw.emprestar()).toThrow(HardwareNaoDisponivelError);
    });
  });

  describe('devolver', () => {
    it('marks hardware as free', () => {
      const hw = makeHardware({ livre: false });
      hw.devolver();
      expect(hw.livre).toBe(true);
    });
  });

  describe('marcarDefeito', () => {
    it('marks hardware as broken and unavailable with problem description', () => {
      const hw = makeHardware();
      hw.marcarDefeito('nao liga');
      expect(hw.funcionando).toBe(false);
      expect(hw.livre).toBe(false);
      expect(hw.descricaoProblema).toBe('nao liga');
    });

    it('requires non-empty problem description', () => {
      const hw = makeHardware();
      expect(() => hw.marcarDefeito('   ')).toThrow(
        DescricaoProblemaObrigatoriaError,
      );
    });
  });

  describe('consertar', () => {
    it('repairs hardware and returns it to available state', () => {
      const hw = makeHardware({
        funcionando: false,
        livre: false,
        descricaoProblema: 'nao liga',
      });
      hw.consertar();
      expect(hw.funcionando).toBe(true);
      expect(hw.livre).toBe(true);
      expect(hw.descricaoProblema).toBeNull();
    });
  });

  describe('domain errors extend DomainError', () => {
    it('HardwareDefeituosoError is a DomainError', () => {
      expect(new HardwareDefeituosoError()).toBeInstanceOf(DomainError);
    });

    it('HardwareNaoDisponivelError is a DomainError', () => {
      expect(new HardwareNaoDisponivelError()).toBeInstanceOf(DomainError);
    });

    it('DescricaoProblemaObrigatoriaError is a DomainError', () => {
      expect(new DescricaoProblemaObrigatoriaError()).toBeInstanceOf(
        DomainError,
      );
    });
  });
});
