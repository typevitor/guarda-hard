import { InvalidTenantPayloadError } from './tenant.errors';
import { TenantContext } from './tenant-context';

describe('TenantContext', () => {
  let tenantContext: TenantContext;

  beforeEach(() => {
    tenantContext = new TenantContext();
  });

  it('stores and reads empresa_id inside run', async () => {
    await tenantContext.run('empresa-1', async () => {
      expect(tenantContext.getEmpresaId()).toBe('empresa-1');
      expect(tenantContext.requireEmpresaId()).toBe('empresa-1');
    });
  });

  it('throws when tenant is missing', () => {
    expect(() => tenantContext.requireEmpresaId()).toThrow(
      'Tenant context is missing empresa_id',
    );
  });

  it('returns null outside context', () => {
    expect(tenantContext.getEmpresaId()).toBeNull();
  });

  it('extracts empresa_id from jwt payload', async () => {
    await tenantContext.runFromJwtPayload(
      { sub: 'user-1', empresa_id: 'empresa-2' },
      async () => {
        expect(tenantContext.requireEmpresaId()).toBe('empresa-2');
      },
    );
  });

  it('throws InvalidTenantPayloadError when jwt payload misses empresa_id', () => {
    try {
      tenantContext.runFromJwtPayload({ sub: 'user-1' }, () => undefined);
      throw new Error('expected runFromJwtPayload to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTenantPayloadError);
      expect((error as Error).message).toBe(
        'JWT payload does not contain empresa_id',
      );
    }
  });
});
