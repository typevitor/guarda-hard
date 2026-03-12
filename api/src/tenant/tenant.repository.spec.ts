import type { FindManyOptions, Repository, UpdateResult } from 'typeorm';
import { CrossTenantAccessError } from './tenant.errors';
import { TenantContext } from './tenant-context';
import type { TenantScopedEntity } from './tenant.types';
import { TenantRepository } from './tenant.repository';

type TestTenantEntity = TenantScopedEntity & {
  nome: string;
  ativo: boolean;
};

describe('TenantRepository', () => {
  let tenantContext: TenantContext;
  let repository: Pick<Repository<TestTenantEntity>, 'find' | 'update'>;
  let tenantRepository: TenantRepository<TestTenantEntity>;

  beforeEach(() => {
    tenantContext = new TenantContext();
    repository = {
      find: vi.fn(),
      update: vi.fn(),
    };
    tenantRepository = new TenantRepository(
      repository as Repository<TestTenantEntity>,
      tenantContext,
    );
  });

  it('find() adds tenant filter where: { empresa_id: currentTenant }', async () => {
    vi.mocked(repository.find).mockResolvedValue([]);

    const options: FindManyOptions<TestTenantEntity> = {
      where: { ativo: true },
    };

    await tenantContext.run('empresa-1', async () => {
      await tenantRepository.find(options);
    });

    expect(repository.find).toHaveBeenCalledWith({
      where: {
        ativo: true,
        empresa_id: 'empresa-1',
      },
    });
  });

  it('find() applies tenant filter for each array where clause', async () => {
    vi.mocked(repository.find).mockResolvedValue([]);

    const options: FindManyOptions<TestTenantEntity> = {
      where: [{ ativo: true }, { nome: 'Notebook' }],
    };

    await tenantContext.run('empresa-1', async () => {
      await tenantRepository.find(options);
    });

    expect(repository.find).toHaveBeenCalledWith({
      where: [
        {
          ativo: true,
          empresa_id: 'empresa-1',
        },
        {
          nome: 'Notebook',
          empresa_id: 'empresa-1',
        },
      ],
    });
  });

  it('updateById() throws CrossTenantAccessError when update affected rows = 0', async () => {
    vi.mocked(repository.update).mockResolvedValue({ affected: 0 } as UpdateResult);

    await tenantContext.run('empresa-1', async () => {
      await expect(
        tenantRepository.updateById('entity-1', {
          nome: 'Atualizado',
        }),
      ).rejects.toBeInstanceOf(CrossTenantAccessError);
    });

    expect(repository.update).toHaveBeenCalledWith(
      {
        id: 'entity-1',
        empresa_id: 'empresa-1',
      },
      {
        nome: 'Atualizado',
      },
    );
  });

  it('updateById() does not throw when update affected rows > 0', async () => {
    vi.mocked(repository.update).mockResolvedValue({ affected: 1 } as UpdateResult);

    await tenantContext.run('empresa-1', async () => {
      await expect(
        tenantRepository.updateById('entity-1', {
          nome: 'Atualizado',
        }),
      ).resolves.toBeUndefined();
    });
  });

  it('updateById() ignores empresa_id mutation attempt in patch', async () => {
    vi.mocked(repository.update).mockResolvedValue({ affected: 1 } as UpdateResult);

    await tenantContext.run('empresa-1', async () => {
      await tenantRepository.updateById('entity-1', {
        nome: 'Atualizado',
        empresa_id: 'empresa-2',
      });
    });

    expect(repository.update).toHaveBeenCalledWith(
      {
        id: 'entity-1',
        empresa_id: 'empresa-1',
      },
      {
        nome: 'Atualizado',
      },
    );
  });
});
