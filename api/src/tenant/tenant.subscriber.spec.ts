import type { InsertEvent, UpdateEvent } from 'typeorm';
import { CrossTenantAccessError } from './tenant.errors';
import { TenantContext } from './tenant-context';
import { TenantSubscriber } from './tenant.subscriber';

describe('TenantSubscriber', () => {
  let tenantContext: TenantContext;
  let subscriber: TenantSubscriber;

  beforeEach(() => {
    tenantContext = new TenantContext();
    subscriber = new TenantSubscriber(tenantContext);
  });

  it('injects empresa_id on insert when field is missing', async () => {
    const event = {
      entity: {},
    } as InsertEvent<Record<string, unknown>>;

    await tenantContext.run('empresa-1', async () => {
      subscriber.beforeInsert(event);
    });

    expect(event.entity?.empresa_id).toBe('empresa-1');
  });

  it('blocks updates when database row belongs to another tenant', async () => {
    const event = {
      databaseEntity: { empresa_id: 'empresa-2' },
    } as unknown as UpdateEvent<Record<string, unknown>>;

    await tenantContext.run('empresa-1', async () => {
      expect(() => subscriber.beforeUpdate(event)).toThrow(CrossTenantAccessError);
    });
  });

  it('blocks updates when incoming entity attempts tenant reassignment', async () => {
    const event = {
      databaseEntity: { empresa_id: 'empresa-1' },
      entity: { empresa_id: 'empresa-2' },
    } as unknown as UpdateEvent<Record<string, unknown>>;

    await tenantContext.run('empresa-1', async () => {
      expect(() => subscriber.beforeUpdate(event)).toThrow(CrossTenantAccessError);
    });
  });
});
