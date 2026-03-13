import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/shared/presentation/http/api-error.filter';
import { TenantContext } from '../../src/tenant/application/tenant-context';
import { TestTenantContext } from './test-tenant-context';
import { DEPARTAMENTO_REPOSITORY } from '../../src/modules/departamentos/domain/repositories/departamento.repository.interface';

class ThrowingDepartamentoRepository {
  async findById(): Promise<null> {
    throw new NotFoundException('not found');
  }

  async findAll(): Promise<[]> {
    return [];
  }

  async listPaginated() {
    return { items: [], page: 1, pageSize: 10 as const, total: 0, totalPages: 0 };
  }

  async save(): Promise<void> {
    throw new Error('boom');
  }

  async delete(): Promise<void> {
    return;
  }
}

describe('API error mapping', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TenantContext)
      .useClass(TestTenantContext)
      .overrideProvider(DEPARTAMENTO_REPOSITORY)
      .useValue(new ThrowingDepartamentoRepository())
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiErrorFilter());
    await app.init();
  });

  it('maps validation errors to standard payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/departamentos')
      .send({ nome: '' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body).toHaveProperty('statusCode', 400);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('details');
  });

  it('maps unexpected errors to internal error payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/departamentos')
      .send({ nome: 'Teste' });

    expect(response.status).toBe(500);
    expect(response.body.code).toBe('INTERNAL_ERROR');
    expect(response.body).toHaveProperty('statusCode', 500);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('details');
  });
});
