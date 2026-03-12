import { DataSource } from 'typeorm';
import { afterEach, describe, expect, it } from 'vitest';
import { Departamento } from '../../src/entities';
import { TenantContext, TenantSubscriber } from '../../src/tenant';
import { createTenantTestDataSource } from './tenant-test-data-source';

describe('tenant integration - auto empresa_id', () => {
  let dataSource: DataSource | null = null;

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    dataSource = null;
  });

  it('injects empresa_id automatically on insert', async () => {
    const initializedDataSource = await createTenantTestDataSource();
    dataSource = initializedDataSource;

    const tenantContext = new TenantContext();
    initializedDataSource.subscribers.push(new TenantSubscriber(tenantContext));

    const repository = initializedDataSource.getRepository(Departamento);

    const saved = await tenantContext.run('empresa-1', async () =>
      repository.save(
        repository.create({
          nome: 'Suporte',
        }),
      ),
    );

    expect(saved.empresa_id).toBe('empresa-1');
  });
});
