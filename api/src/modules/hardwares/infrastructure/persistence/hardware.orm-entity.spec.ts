import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../../../../infrastructure/database/data-source';

describe('HardwareOrmEntity metadata', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  });
  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('has required columns', () => {
    const meta = AppDataSource.getMetadata('HardwareOrmEntity');
    const cols = meta.columns.map((c) => c.propertyName);
    expect(cols).toEqual(
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
        'version',
      ]),
    );
  });
});
