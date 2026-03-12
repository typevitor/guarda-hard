import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../infrastructure/database/data-source';

describe('Entity metadata', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('keeps etapa 4 entity contracts required by PRD', () => {
    const departamento = AppDataSource.getMetadata('Departamento');
    const usuario = AppDataSource.getMetadata('Usuario');
    const hardware = AppDataSource.getMetadata('Hardware');
    const emprestimo = AppDataSource.getMetadata('Emprestimo');

    expect(departamento.columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining(['id', 'empresa_id', 'nome', 'created_at']),
    );
    expect(usuario.columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining([
        'id',
        'empresa_id',
        'departamento_id',
        'nome',
        'email',
        'ativo',
      ]),
    );
    expect(usuario.relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['departamento']),
    );
    expect(hardware.columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining([
        'id',
        'empresa_id',
        'descricao',
        'marca',
        'modelo',
        'codigo_patrimonio',
        'funcionando',
        'descricao_problema',
        'livre',
      ]),
    );
    expect(emprestimo.columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining([
        'id',
        'empresa_id',
        'usuario_id',
        'hardware_id',
        'data_retirada',
        'data_devolucao',
      ]),
    );
    expect(emprestimo.relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['usuario', 'hardware']),
    );
  });
});
