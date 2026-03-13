import { DataSource } from 'typeorm';
import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { DepartamentoOrmEntity } from '../../src/modules/departamentos/infrastructure/persistence/departamento.orm-entity';
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

    const repository = initializedDataSource.getRepository(
      DepartamentoOrmEntity,
    );
    await repository.save([
      repository.create({
        id: randomUUID(),
        empresa_id: 'empresa-1',
        nome: 'Suporte',
      }),
      repository.create({
        id: randomUUID(),
        empresa_id: 'empresa-2',
        nome: 'Financeiro',
      }),
    ]);

    const tenantContext = new TenantContext();
    const tenantRepository = new TenantRepository<DepartamentoOrmEntity>(
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
