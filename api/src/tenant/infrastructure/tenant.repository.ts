import type { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { CrossTenantAccessError } from './tenant.errors';
import { TenantContext } from '../application/tenant-context';
import type { TenantScopedEntity } from './tenant.types';

export class TenantRepository<T extends TenantScopedEntity> {
  constructor(
    private readonly repository: Repository<T>,
    private readonly tenantContext: TenantContext,
  ) {}

  find(options: FindManyOptions<T> = {}): Promise<T[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const where = options.where;

    const tenantWhere = Array.isArray(where)
      ? where.map((clause) => ({
          ...clause,
          empresa_id: empresaId,
        }))
      : {
          ...(where ?? {}),
          empresa_id: empresaId,
        };

    return this.repository.find({
      ...options,
      where: tenantWhere as FindOptionsWhere<T> | FindOptionsWhere<T>[],
    });
  }

  async updateById(
    id: string,
    patch: Parameters<Repository<T>['update']>[1],
  ): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const safePatch = this.removeTenantMutation(patch);
    const result = await this.repository.update(
      { id, empresa_id: empresaId } as FindOptionsWhere<T>,
      safePatch,
    );

    if (!result.affected) {
      throw new CrossTenantAccessError();
    }
  }

  private removeTenantMutation(
    patch: Parameters<Repository<T>['update']>[1],
  ): Parameters<Repository<T>['update']>[1] {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      return patch;
    }

    const unsafePatch = patch as {
      empresa_id?: unknown;
    } & Record<string, unknown>;
    const rest = { ...unsafePatch };

    delete rest.empresa_id;

    return rest as Parameters<Repository<T>['update']>[1];
  }
}
