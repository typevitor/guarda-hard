import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { TenantContext } from '../../src/tenant/application/tenant-context';
import { MissingTenantContextError } from '../../src/tenant/infrastructure/tenant.errors';
import { ApiErrorFilter } from '../../src/shared/presentation/http/api-error.filter';

class MissingTenantTestContext extends TenantContext {
  override getEmpresaId(): string | null {
    return null;
  }

  override requireEmpresaId(): string {
    throw new MissingTenantContextError();
  }
}

describe('Departamentos create error mapping', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TenantContext)
      .useClass(MissingTenantTestContext)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiErrorFilter());
    await app.init();
  });

  it('returns AUTH_REQUIRED instead of opaque 500 when tenant context is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/departamentos')
      .send({ nome: 'Financeiro' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTH_REQUIRED');
    expect(response.body).toHaveProperty('statusCode', 401);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('details');
  });
});
