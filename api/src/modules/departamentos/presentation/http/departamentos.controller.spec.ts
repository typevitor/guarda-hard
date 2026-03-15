import { describe, expect, it } from 'vitest';
import { DepartamentosController } from './departamentos.controller';

describe('DepartamentosController', () => {
  it('returns only id and nome on listOptions', async () => {
    const departamentosService = {
      listOptions: () => [
        { id: 'dep-2', nome: 'Administracao' },
        { id: 'dep-1', nome: 'Suporte' },
      ],
    };

    const controller = new DepartamentosController(
      departamentosService as never,
    );

    await expect(controller.listOptions()).resolves.toEqual([
      { id: 'dep-2', nome: 'Administracao' },
      { id: 'dep-1', nome: 'Suporte' },
    ]);
  });
});
