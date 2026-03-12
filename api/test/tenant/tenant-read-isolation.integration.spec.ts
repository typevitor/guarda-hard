import { DataSource } from 'typeorm';
import { afterEach, describe, expect, it } from 'vitest';
import { Departamento } from '../../src/entities';
import { TenantContext, TenantRepository } from '../../src/tenant';
import { createTenantTestDataSource } from './tenant-test-data-source';

describe('tenant integration - read isolation', () => {
  let dataSource: DataSource | null = null;

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    dataSource = null;
  });

  it('returns only rows for current tenant', async () => {
    const initializedDataSource = await createTenantTestDataSource();
    dataSource = initializedDataSource;

    const repository = initializedDataSource.getRepository(Departamento);
    await repository.save([
      repository.create({ empresa_id: 'empresa-1', nome: 'Suporte' }),
      repository.create({ empresa_id: 'empresa-2', nome: 'Financeiro' }),
    ]);

    const tenantContext = new TenantContext();
    const tenantRepository = new TenantRepository<Departamento>(
      repository,
      tenantContext,
    );

    const rows = await tenantContext.run('empresa-1', async () =>
      tenantRepository.find(),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.empresa_id).toBe('empresa-1');
    expect(rows[0]?.nome).toBe('Suporte');
  });
});
