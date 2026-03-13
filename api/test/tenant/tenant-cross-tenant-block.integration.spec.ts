import { DataSource } from 'typeorm';
import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { DepartamentoOrmEntity } from '../../src/modules/departamentos/infrastructure/persistence/departamento.orm-entity';
import {
  CrossTenantAccessError,
  TenantContext,
  TenantSubscriber,
} from '../../src/tenant';
import { createTenantTestDataSource } from './tenant-test-data-source';

describe('tenant integration - cross-tenant update block', () => {
  let dataSource: DataSource | null = null;

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    dataSource = null;
  });

  it('blocks update when persisted row belongs to another tenant', async () => {
    const initializedDataSource = await createTenantTestDataSource();
    dataSource = initializedDataSource;

    const tenantContext = new TenantContext();
    initializedDataSource.subscribers.push(new TenantSubscriber(tenantContext));

    const repository = initializedDataSource.getRepository(
      DepartamentoOrmEntity,
    );

    const otherTenantRow = await tenantContext.run('empresa-2', async () =>
      repository.save(
        repository.create({
          id: randomUUID(),
          nome: 'Financeiro',
        }),
      ),
    );

    await tenantContext.run('empresa-1', async () => {
      await expect(
        repository.save({
          id: otherTenantRow.id,
          nome: 'Financeiro Atualizado',
        }),
      ).rejects.toBeInstanceOf(CrossTenantAccessError);
    });
  });
});
