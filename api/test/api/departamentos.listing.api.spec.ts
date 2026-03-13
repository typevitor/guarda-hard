import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { DEPARTAMENTO_REPOSITORY } from '../../src/modules/departamentos/domain/repositories/departamento.repository.interface';
import { Departamento } from '../../src/modules/departamentos/domain/entities/departamento.entity';
import { TenantContext } from '../../src/tenant/application/tenant-context';
import { TestTenantContext } from './test-tenant-context';

class InMemoryDepartamentoRepository {
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
    return [...this.rows.values()].filter((row) => row.empresaId === this.currentTenant);
  }

  async listPaginated(query: { page: number; pageSize: 10; search?: string }) {
    const filtered = [...this.rows.values()]
      .filter((row) => row.empresaId === this.currentTenant)
      .filter((row) =>
        query.search ? row.nome.toLowerCase().includes(query.search.toLowerCase()) : true,
      )
      .sort((a, b) => {
        const createdDiff = b.createdAt.getTime() - a.createdAt.getTime();
        if (createdDiff !== 0) {
          return createdDiff;
        }

        return b.id.localeCompare(a.id);
      });

    const start = (query.page - 1) * 10;
    const items = filtered.slice(start, start + 10);

    return {
      items,
      page: query.page,
      pageSize: 10 as const,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / 10),
    };
  }

  async save(entity: Departamento): Promise<void> {
    this.rows.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

describe('Departamentos listing API', () => {
  let app: INestApplication;
  let repository: InMemoryDepartamentoRepository;

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
  });

  it('returns paginated envelope with fixed pageSize and supports search', async () => {
    await request(app.getHttpServer()).post('/departamentos').send({ nome: 'Suporte' });
    await request(app.getHttpServer()).post('/departamentos').send({ nome: 'Comercial' });

    const response = await request(app.getHttpServer()).get('/departamentos?page=1&pageSize=200&search=sup');

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(10);
    expect(response.body.total).toBe(1);
    expect(response.body.totalPages).toBe(1);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].nome).toBe('Suporte');
  });
});
