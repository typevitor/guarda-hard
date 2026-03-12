import { describe, expect, it } from 'vitest';
import { Departamento, Usuario, Hardware, Emprestimo } from './index';

describe('Entity metadata', () => {
  it('exports all etapa 2 entity classes', () => {
    expect(Departamento).toBeDefined();
    expect(Usuario).toBeDefined();
    expect(Hardware).toBeDefined();
    expect(Emprestimo).toBeDefined();
    expect(Departamento.name).toBe('Departamento');
    expect(Usuario.name).toBe('Usuario');
    expect(Hardware.name).toBe('Hardware');
    expect(Emprestimo.name).toBe('Emprestimo');
  });
});
