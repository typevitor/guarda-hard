import { describe, expect, it } from 'vitest';
import { Emprestimo } from './emprestimo.entity';
import { EmprestimoJaDevolvidoError } from '../errors/emprestimo-ja-devolvido.error';
import { DomainError } from '../../../../shared/domain/domain-error.base';

describe('Emprestimo domain entity', () => {
  describe('emprestar factory', () => {
    it('creates loan with generated UUID and default date', () => {
      const before = new Date();
      const emp = Emprestimo.emprestar({
        empresaId: 'empresa-a',
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
      });
      const after = new Date();

      expect(emp.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(emp.empresaId).toBe('empresa-a');
      expect(emp.usuarioId).toBe('usuario-1');
      expect(emp.hardwareId).toBe('hardware-1');
      expect(emp.dataRetirada.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(emp.dataRetirada.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(emp.dataDevolucao).toBeNull();
      expect(emp.estaDevolvido).toBe(false);
    });

    it('accepts explicit dataRetirada', () => {
      const retirada = new Date('2026-03-12T12:00:00.000Z');
      const emp = Emprestimo.emprestar({
        empresaId: 'empresa-a',
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
        dataRetirada: retirada,
      });
      expect(emp.dataRetirada).toEqual(retirada);
    });
  });

  describe('devolver', () => {
    it('sets return date', () => {
      const emp = Emprestimo.emprestar({
        empresaId: 'empresa-a',
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
      });
      const devolucao = new Date('2026-03-13T12:00:00.000Z');
      emp.devolver(devolucao);
      expect(emp.dataDevolucao).toEqual(devolucao);
      expect(emp.estaDevolvido).toBe(true);
    });

    it('defaults return date to now', () => {
      const emp = Emprestimo.emprestar({
        empresaId: 'empresa-a',
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
      });
      const before = new Date();
      emp.devolver();
      const after = new Date();
      expect(emp.dataDevolucao!.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(emp.dataDevolucao!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('rejects duplicate return', () => {
      const emp = Emprestimo.emprestar({
        empresaId: 'empresa-a',
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
      });
      emp.devolver(new Date('2026-03-13T12:00:00.000Z'));
      expect(() => emp.devolver(new Date('2026-03-14T12:00:00.000Z'))).toThrow(
        EmprestimoJaDevolvidoError,
      );
    });
  });

  describe('domain errors extend DomainError', () => {
    it('EmprestimoJaDevolvidoError is a DomainError', () => {
      expect(new EmprestimoJaDevolvidoError()).toBeInstanceOf(DomainError);
    });
  });
});
