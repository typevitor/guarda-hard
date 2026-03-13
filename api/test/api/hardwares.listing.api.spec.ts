import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { HARDWARE_REPOSITORY } from '../../src/modules/hardwares/domain/repositories/hardware.repository.interface';
import { Hardware } from '../../src/modules/hardwares/domain/entities/hardware.entity';
import { TenantContext } from '../../src/tenant/application/tenant-context';
import { TestTenantContext } from './test-tenant-context';

class InMemoryHardwareRepository {
  private readonly rows = new Map<string, Hardware>();

  async findById(id: string): Promise<Hardware | null> {
    return this.rows.get(id) ?? null;
  }

  async findAll(): Promise<Hardware[]> {
    return [...this.rows.values()];
  }

  async listPaginated(query: {
    page: number;
    pageSize: 10;
    search?: string;
    funcionando?: boolean;
    livre?: boolean;
  }) {
    const filtered = [...this.rows.values()]
      .filter((row) => (query.search ? row.descricao.toLowerCase().includes(query.search.toLowerCase()) : true))
      .filter((row) => (query.funcionando !== undefined ? row.funcionando === query.funcionando : true))
      .filter((row) => (query.livre !== undefined ? row.livre === query.livre : true));

    return {
      items: filtered,
      page: query.page,
      pageSize: 10 as const,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / 10),
    };
  }

  async save(entity: Hardware): Promise<void> {
    this.rows.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

describe('Hardwares listing API', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HARDWARE_REPOSITORY)
      .useValue(new InMemoryHardwareRepository())
      .overrideProvider(TenantContext)
      .useClass(TestTenantContext)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('returns paginated envelope and applies free/working filters', async () => {
    await request(app.getHttpServer()).post('/hardwares').send({
      descricao: 'Notebook',
      marca: 'Dell',
      modelo: 'Latitude',
      codigoPatrimonio: 'PAT-A',
    });

    const response = await request(app.getHttpServer()).get('/hardwares?funcionando=true&livre=true');

    expect(response.status).toBe(200);
    expect(response.body.pageSize).toBe(10);
    expect(response.body.items).toHaveLength(1);
  });
});
