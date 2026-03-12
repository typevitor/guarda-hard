import { afterEach, describe, expect, it } from 'vitest';
import { Departamento } from '../../src/entities';
import {
  CrossTenantAccessError,
  TenantContext,
  TenantRepository,
  TenantSubscriber,
} from '../../src/tenant';
import { createDomainTestDataSource } from './domain-test-data-source';

describe('Domain integration - multi tenant isolation', () => {
  const dataSource = createDomainTestDataSource();
  const tenantContext = new TenantContext();

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('ensures tenant A cannot read tenant B rows through TenantRepository', async () => {
    await dataSource.initialize();
    dataSource.subscribers.push(new TenantSubscriber(tenantContext));

    const rawRepo = dataSource.getRepository(Departamento);
    const tenantRepo = new TenantRepository(rawRepo, tenantContext);

    await tenantContext.run('empresa-a', async () => {
      await rawRepo.save(rawRepo.create({ nome: 'Suporte A' }));
    });

    await tenantContext.run('empresa-b', async () => {
      await rawRepo.save(rawRepo.create({ nome: 'Suporte B' }));
    });

    await tenantContext.run('empresa-a', async () => {
      const rows = await tenantRepo.find();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.empresa_id).toBe('empresa-a');
      expect(rows[0]?.nome).toBe('Suporte A');
    });
  });

  it('blocks cross-tenant update attempts', async () => {
    await dataSource.initialize();
    dataSource.subscribers.push(new TenantSubscriber(tenantContext));

    const rawRepo = dataSource.getRepository(Departamento);
    const tenantRepo = new TenantRepository(rawRepo, tenantContext);

    const departamentoTenantB = await tenantContext.run(
      'empresa-b',
      async () => {
        return rawRepo.save(rawRepo.create({ nome: 'Comercial B' }));
      },
    );

    await tenantContext.run('empresa-a', async () => {
      await expect(
        tenantRepo.updateById(departamentoTenantB.id, {
          nome: 'Tentativa indevida',
        }),
      ).rejects.toThrow(CrossTenantAccessError);
    });
  });
});
