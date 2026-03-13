import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { HARDWARE_REPOSITORY } from '../../src/modules/hardwares/domain/repositories/hardware.repository.interface';
import { Hardware } from '../../src/modules/hardwares/domain/entities/hardware.entity';
import { TenantContext } from '../../src/tenant/application/tenant-context';
import { TestTenantContext } from './test-tenant-context';

type HardwareRepo = {
  findById(id: string): Promise<Hardware | null>;
  findAll(): Promise<Hardware[]>;
  listPaginated(query: {
    page: number;
    pageSize: 10;
    search?: string;
    funcionando?: boolean;
    livre?: boolean;
  }): Promise<{
    items: Hardware[];
    page: number;
    pageSize: 10;
    total: number;
    totalPages: number;
  }>;
  save(entity: Hardware): Promise<void>;
  delete(id: string): Promise<void>;
};

class InMemoryHardwareRepository implements HardwareRepo {
  private readonly rows = new Map<string, Hardware>();
  private currentTenant = 'empresa-a';

  setCurrentTenant(tenant: string): void {
    this.currentTenant = tenant;
  }

  async findById(id: string): Promise<Hardware | null> {
    const row = this.rows.get(id);
    if (!row || row.empresaId !== this.currentTenant) {
      return null;
    }

    return row;
  }

  async findAll(): Promise<Hardware[]> {
    return [...this.rows.values()].filter(
      (row) => row.empresaId === this.currentTenant,
    );
  }

  async listPaginated(query: {
    page: number;
    pageSize: 10;
    search?: string;
    funcionando?: boolean;
    livre?: boolean;
  }): Promise<{
    items: Hardware[];
    page: number;
    pageSize: 10;
    total: number;
    totalPages: number;
  }> {
    const filtered = (await this.findAll())
      .filter((row) =>
        query.search
          ? row.descricao.toLowerCase().includes(query.search.toLowerCase())
          : true,
      )
      .filter((row) =>
        query.funcionando !== undefined ? row.funcionando === query.funcionando : true,
      )
      .filter((row) => (query.livre !== undefined ? row.livre === query.livre : true));

    const start = (query.page - 1) * 10;
    const items = filtered.slice(start, start + 10);

    return {
      items,
      page: query.page,
      pageSize: 10,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / 10),
    };
  }

  async save(entity: Hardware): Promise<void> {
    this.rows.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row && row.empresaId === this.currentTenant) {
      this.rows.delete(id);
    }
  }
}

describe('Hardwares API', () => {
  let app: INestApplication;
  let repository: InMemoryHardwareRepository;
  let tenantContext: TestTenantContext;

  beforeEach(async () => {
    repository = new InMemoryHardwareRepository();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HARDWARE_REPOSITORY)
      .useValue(repository)
      .overrideProvider(TenantContext)
      .useClass(TestTenantContext)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    tenantContext = app.get(TenantContext);
  });

  it('supports CRUD, defeito, conserto and cross-tenant isolation', async () => {
    tenantContext.setEmpresaId('empresa-a');
    repository.setCurrentTenant('empresa-a');

    const createA = await request(app.getHttpServer()).post('/hardwares').send({
      descricao: 'Notebook',
      marca: 'Dell',
      modelo: 'Latitude',
      codigoPatrimonio: 'PAT-A',
    });

    expect(createA.status).toBe(201);
    expect(createA.body.funcionando).toBe(true);
    expect(createA.body.livre).toBe(true);
    const createdId = createA.body.id as string;

    tenantContext.setEmpresaId('empresa-b');
    repository.setCurrentTenant('empresa-b');

    const createB = await request(app.getHttpServer()).post('/hardwares').send({
      descricao: 'Desktop',
      marca: 'HP',
      modelo: 'ProDesk',
      codigoPatrimonio: 'PAT-B',
    });
    expect(createB.status).toBe(201);

    const listB = await request(app.getHttpServer()).get('/hardwares');
    expect(listB.status).toBe(200);
    expect(listB.body.items).toHaveLength(1);
    expect(listB.body.items[0].codigoPatrimonio).toBe('PAT-B');

    const getCrossTenant = await request(app.getHttpServer()).get(
      `/hardwares/${createdId}`,
    );
    expect(getCrossTenant.status).toBe(404);

    const defeitoCrossTenant = await request(app.getHttpServer())
      .post(`/hardwares/${createdId}/defeito`)
      .send({ descricaoProblema: 'nao liga' });
    expect(defeitoCrossTenant.status).toBe(404);

    tenantContext.setEmpresaId('empresa-a');
    repository.setCurrentTenant('empresa-a');

    const patchA = await request(app.getHttpServer())
      .patch(`/hardwares/${createdId}`)
      .send({ modelo: 'Latitude 2' });
    expect(patchA.status).toBe(200);
    expect(patchA.body.modelo).toBe('Latitude 2');

    const defeitoA = await request(app.getHttpServer())
      .post(`/hardwares/${createdId}/defeito`)
      .send({ descricaoProblema: 'nao liga' });
    expect(defeitoA.status).toBe(201);
    expect(defeitoA.body.funcionando).toBe(false);
    expect(defeitoA.body.livre).toBe(false);

    const consertoA = await request(app.getHttpServer()).post(
      `/hardwares/${createdId}/conserto`,
    );
    expect(consertoA.status).toBe(201);
    expect(consertoA.body.funcionando).toBe(true);
    expect(consertoA.body.livre).toBe(true);
    expect(consertoA.body.descricaoProblema).toBeNull();

    const deleteA = await request(app.getHttpServer()).delete(
      `/hardwares/${createdId}`,
    );
    expect(deleteA.status).toBe(204);
  });

  it('returns 400 for invalid defeito payload', async () => {
    tenantContext.setEmpresaId('empresa-a');
    repository.setCurrentTenant('empresa-a');

    const created = await request(app.getHttpServer()).post('/hardwares').send({
      descricao: 'Notebook',
      marca: 'Dell',
      modelo: 'Latitude',
      codigoPatrimonio: 'PAT-X',
    });

    const response = await request(app.getHttpServer())
      .post(`/hardwares/${created.body.id}/defeito`)
      .send({ descricaoProblema: '   ' });

    expect(response.status).toBe(400);
  });
});
