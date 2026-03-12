import { describe, expect, it } from 'vitest';
import { Emprestimo } from './emprestimo.entity';
import { Hardware } from './hardware.entity';
import {
  EmprestimoJaDevolvidoError,
  HardwareDefeituosoError,
  HardwareNaoDisponivelError,
} from './domain.errors';

describe('Emprestimo domain', () => {
  it('creates loan for available hardware and marks hardware as not free', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: true,
      livre: true,
      descricao_problema: null,
    });

    const retirada = new Date('2026-03-12T12:00:00.000Z');
    const emprestimo = Emprestimo.emprestar({
      empresa_id: 'empresa-a',
      usuario_id: 'usuario-1',
      hardware_id: 'hardware-1',
      hardware,
      data_retirada: retirada,
    });

    expect(emprestimo.empresa_id).toBe('empresa-a');
    expect(emprestimo.usuario_id).toBe('usuario-1');
    expect(emprestimo.hardware_id).toBe('hardware-1');
    expect(emprestimo.data_retirada).toEqual(retirada);
    expect(emprestimo.data_devolucao).toBeNull();
    expect(hardware.livre).toBe(false);
  });

  it('rejects loan when hardware is already occupied', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: true,
      livre: false,
      descricao_problema: null,
    });

    expect(() =>
      Emprestimo.emprestar({
        empresa_id: 'empresa-a',
        usuario_id: 'usuario-1',
        hardware_id: 'hardware-1',
        hardware,
      }),
    ).toThrow(HardwareNaoDisponivelError);
  });

  it('rejects loan when hardware is broken', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: false,
      livre: true,
      descricao_problema: 'nao liga',
    });

    expect(() =>
      Emprestimo.emprestar({
        empresa_id: 'empresa-a',
        usuario_id: 'usuario-1',
        hardware_id: 'hardware-1',
        hardware,
      }),
    ).toThrow(HardwareDefeituosoError);
  });

  it('returns loan and frees hardware', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: true,
      livre: true,
      descricao_problema: null,
    });
    const emprestimo = Emprestimo.emprestar({
      empresa_id: 'empresa-a',
      usuario_id: 'usuario-1',
      hardware_id: 'hardware-1',
      hardware,
    });

    const devolucao = new Date('2026-03-13T12:00:00.000Z');
    emprestimo.devolver(hardware, devolucao);

    expect(emprestimo.data_devolucao).toEqual(devolucao);
    expect(hardware.livre).toBe(true);
  });

  it('rejects duplicate return for same loan', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: true,
      livre: true,
      descricao_problema: null,
    });
    const emprestimo = Emprestimo.emprestar({
      empresa_id: 'empresa-a',
      usuario_id: 'usuario-1',
      hardware_id: 'hardware-1',
      hardware,
    });

    emprestimo.devolver(hardware, new Date('2026-03-13T12:00:00.000Z'));
    expect(() =>
      emprestimo.devolver(hardware, new Date('2026-03-14T12:00:00.000Z')),
    ).toThrow(EmprestimoJaDevolvidoError);
  });
});
