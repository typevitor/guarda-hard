import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { DEPARTAMENTO_REPOSITORY } from '../../src/modules/departamentos/domain/repositories/departamento.repository.interface';
import { Departamento } from '../../src/modules/departamentos/domain/entities/departamento.entity';
import { TenantContext } from '../../src/tenant/application/tenant-context';
import { TestTenantContext } from './test-tenant-context';

type DepartamentoRepo = {
  findById(id: string): Promise<Departamento | null>;
  findAll(): Promise<Departamento[]>;
  save(entity: Departamento): Promise<void>;
  delete(id: string): Promise<void>;
};

class InMemoryDepartamentoRepository implements DepartamentoRepo {
  private readonly rows = new Map<string, Departamento>();
  private currentTenant = 'empresa-a';

  setCurrentTenant(tenant: string): void {
    this.currentTenant = tenant;
  }

  async findById(id: string): Promise<Departamento | null> {
    const row = this.rows.get(id);
    if (!row || row.empresaId !== this.currentTenant) {
      return null;
    }

    return row;
  }

  async findAll(): Promise<Departamento[]> {
    return [...this.rows.values()].filter(
      (row) => row.empresaId === this.currentTenant,
    );
  }

  async save(entity: Departamento): Promise<void> {
    this.rows.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row && row.empresaId === this.currentTenant) {
      this.rows.delete(id);
    }
  }
}

describe('Departamentos API', () => {
  let app: INestApplication;
  let repository: InMemoryDepartamentoRepository;
  let tenantContext: TestTenantContext;

  beforeEach(async () => {
    repository = new InMemoryDepartamentoRepository();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DEPARTAMENTO_REPOSITORY)
      .useValue(repository)
      .overrideProvider(TenantContext)
      .useClass(TestTenantContext)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    tenantContext = app.get(TenantContext);
  });

  it('returns 400 when payload is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/departamentos')
      .send({});

    expect(response.status).toBe(400);
  });

  it('implements CRUD and cross-tenant isolation', async () => {
    tenantContext.setEmpresaId('empresa-a');
    repository.setCurrentTenant('empresa-a');

    const createA = await request(app.getHttpServer())
      .post('/departamentos')
      .send({ nome: 'Suporte' });

    expect(createA.status).toBe(201);
    const createdId = createA.body.id as string;

    tenantContext.setEmpresaId('empresa-b');
    repository.setCurrentTenant('empresa-b');

    const createB = await request(app.getHttpServer())
      .post('/departamentos')
      .send({ nome: 'Comercial' });

    expect(createB.status).toBe(201);

    const listB = await request(app.getHttpServer()).get('/departamentos');
    expect(listB.status).toBe(200);
    expect(listB.body).toHaveLength(1);
    expect(listB.body[0].nome).toBe('Comercial');

    const getCrossTenant = await request(app.getHttpServer()).get(
      `/departamentos/${createdId}`,
    );
    expect(getCrossTenant.status).toBe(404);

    const patchCrossTenant = await request(app.getHttpServer())
      .patch(`/departamentos/${createdId}`)
      .send({ nome: 'Nao deve atualizar' });
    expect(patchCrossTenant.status).toBe(404);

    const deleteCrossTenant = await request(app.getHttpServer()).delete(
      `/departamentos/${createdId}`,
    );
    expect(deleteCrossTenant.status).toBe(404);

    tenantContext.setEmpresaId('empresa-a');
    repository.setCurrentTenant('empresa-a');

    const getA = await request(app.getHttpServer()).get(
      `/departamentos/${createdId}`,
    );
    expect(getA.status).toBe(200);
    expect(getA.body.nome).toBe('Suporte');

    const patchA = await request(app.getHttpServer())
      .patch(`/departamentos/${createdId}`)
      .send({ nome: 'Suporte N2' });
    expect(patchA.status).toBe(200);
    expect(patchA.body.nome).toBe('Suporte N2');

    const listA = await request(app.getHttpServer()).get('/departamentos');
    expect(listA.status).toBe(200);
    expect(listA.body).toHaveLength(1);
    expect(listA.body[0].nome).toBe('Suporte N2');

    const deleteA = await request(app.getHttpServer()).delete(
      `/departamentos/${createdId}`,
    );
    expect(deleteA.status).toBe(204);

    const getDeleted = await request(app.getHttpServer()).get(
      `/departamentos/${createdId}`,
    );
    expect(getDeleted.status).toBe(404);
  });
});
