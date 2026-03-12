import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { AppModule } from '../app.module';
import { TenantContext } from './tenant-context';

vi.mock('../infrastructure/database/database.module', () => ({
  DatabaseModule: class DatabaseModule {},
}));

describe('TenantModule wiring', () => {
  it('resolves TenantContext from AppModule', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const tenantContext = moduleRef.get(TenantContext);

    expect(tenantContext).toBeInstanceOf(TenantContext);
  });
});
