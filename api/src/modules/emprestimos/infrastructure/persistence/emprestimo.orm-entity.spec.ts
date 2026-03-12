import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../../../../infrastructure/database/data-source';

describe('EmprestimoOrmEntity metadata', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  });
  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('has required columns and relations', () => {
    const meta = AppDataSource.getMetadata('EmprestimoOrmEntity');
    const cols = meta.columns.map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'empresa_id',
        'usuario_id',
        'hardware_id',
        'data_retirada',
        'data_devolucao',
      ]),
    );
    expect(meta.relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['usuario', 'hardware']),
    );
  });
});
