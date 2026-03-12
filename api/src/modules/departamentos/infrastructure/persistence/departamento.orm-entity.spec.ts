import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../../../../infrastructure/database/data-source';

describe('DepartamentoOrmEntity metadata', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  });
  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('has required columns', () => {
    const meta = AppDataSource.getMetadata('DepartamentoOrmEntity');
    const cols = meta.columns.map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'empresa_id',
        'nome',
        'created_at',
        'updated_at',
      ]),
    );
  });
});
