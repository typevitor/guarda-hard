import type { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { CrossTenantAccessError } from './tenant.errors';
import { TenantContext } from './tenant-context';
import type { TenantScopedEntity } from './tenant.types';

export class TenantRepository<T extends TenantScopedEntity> {
  constructor(
    private readonly repository: Repository<T>,
    private readonly tenantContext: TenantContext,
  ) {}

  find(options: FindManyOptions<T> = {}): Promise<T[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const where = options.where as FindOptionsWhere<T>;

    return this.repository.find({
      ...options,
      where: {
        ...(where ?? {}),
        empresa_id: empresaId,
      } as FindOptionsWhere<T>,
    });
  }

  async updateById(
    id: string,
    patch: Parameters<Repository<T>['update']>[1],
  ): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const result = await this.repository.update({ id, empresa_id: empresaId } as FindOptionsWhere<T>, patch);

    if (!result.affected) {
      throw new CrossTenantAccessError();
    }
  }
}
