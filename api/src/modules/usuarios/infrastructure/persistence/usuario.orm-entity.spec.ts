import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../../../../infrastructure/database/data-source';

describe('UsuarioOrmEntity metadata', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  });
  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('has required columns and relations', () => {
    const meta = AppDataSource.getMetadata('UsuarioOrmEntity');
    const cols = meta.columns.map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'empresa_id',
        'departamento_id',
        'nome',
        'email',
        'senha_hash',
        'ativo',
      ]),
    );
    expect(meta.relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['departamento']),
    );
  });
});
