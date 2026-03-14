import { describe, expect, it } from 'vitest';
import { ListEmpresasUseCase } from './list-empresas.use-case';
import { IEmpresaRepository } from '../../domain/repositories/empresa.repository.interface';
import { Empresa } from '../../domain/entities/empresa.entity';

describe('ListEmpresasUseCase', () => {
  it('returns sorted empresas list', async () => {
    const repository: IEmpresaRepository = {
      async findAll(): Promise<Empresa[]> {
        return [
          new Empresa({ id: '2', nome: 'Zeta' }),
          new Empresa({ id: '1', nome: 'Alpha' }),
        ];
      },
    };

    const useCase = new ListEmpresasUseCase(repository);

    const result = await useCase.execute();

    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('nome');
    expect(result).toEqual([
      { id: '1', nome: 'Alpha' },
      { id: '2', nome: 'Zeta' },
    ]);
  });
});
