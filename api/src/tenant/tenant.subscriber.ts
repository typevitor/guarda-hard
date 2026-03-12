import { EventSubscriber } from 'typeorm';
import type {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { CrossTenantAccessError } from './tenant.errors';
import { TenantContext } from './tenant-context';

@EventSubscriber()
export class TenantSubscriber
  implements EntitySubscriberInterface<Record<string, unknown>>
{
  constructor(private readonly tenantContext: TenantContext) {}

  beforeInsert(event: InsertEvent<Record<string, unknown>>): void {
    if (!event.entity) {
      return;
    }

    const currentEmpresaId = this.tenantContext.requireEmpresaId();
    const incomingEmpresaId = event.entity.empresa_id;

    if (incomingEmpresaId == null) {
      event.entity.empresa_id = currentEmpresaId;
      return;
    }

    if (incomingEmpresaId !== currentEmpresaId) {
      throw new CrossTenantAccessError();
    }
  }

  beforeUpdate(event: UpdateEvent<Record<string, unknown>>): void {
    if (!event.databaseEntity) {
      return;
    }

    if (!('empresa_id' in event.databaseEntity)) {
      return;
    }

    const persistedEmpresaId = event.databaseEntity.empresa_id;

    if (persistedEmpresaId == null) {
      return;
    }

    const currentEmpresaId = this.tenantContext.requireEmpresaId();

    if (persistedEmpresaId !== currentEmpresaId) {
      throw new CrossTenantAccessError();
    }

    const incomingEmpresaId = event.entity?.empresa_id;

    if (incomingEmpresaId != null && incomingEmpresaId !== currentEmpresaId) {
      throw new CrossTenantAccessError();
    }
  }
}
