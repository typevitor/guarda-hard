import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { USUARIO_REPOSITORY } from '../../src/modules/usuarios/domain/repositories/usuario.repository.interface';
import { Usuario } from '../../src/modules/usuarios/domain/entities/usuario.entity';
import { TenantContext } from '../../src/tenant/application/tenant-context';
import { TestTenantContext } from './test-tenant-context';

class InMemoryUsuarioRepository {
  private readonly rows = new Map<string, Usuario>();

  async findById(id: string): Promise<Usuario | null> {
    return this.rows.get(id) ?? null;
  }

  async findAll(): Promise<Usuario[]> {
    return [...this.rows.values()];
  }

  async listPaginated(query: {
    page: number;
    pageSize: 10;
    search?: string;
    departamentoId?: string;
    ativo?: boolean;
  }) {
    const filtered = [...this.rows.values()]
      .filter((row) => (query.search ? row.nome.toLowerCase().includes(query.search.toLowerCase()) : true))
      .filter((row) => (query.departamentoId ? row.departamentoId === query.departamentoId : true))
      .filter((row) => (query.ativo !== undefined ? row.ativo === query.ativo : true));

    return {
      items: filtered,
      page: query.page,
      pageSize: 10 as const,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / 10),
    };
  }

  async save(entity: Usuario): Promise<void> {
    this.rows.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

describe('Usuarios listing API', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USUARIO_REPOSITORY)
      .useValue(new InMemoryUsuarioRepository())
      .overrideProvider(TenantContext)
      .useClass(TestTenantContext)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('returns paginated envelope and applies boolean filters', async () => {
    await request(app.getHttpServer()).post('/usuarios').send({
      departamentoId: '2c22959a-720d-4cf6-b4f9-5d6f42880d2b',
      nome: 'Alice',
      email: 'alice@test.com',
    });

    const response = await request(app.getHttpServer()).get('/usuarios?ativo=true');

    expect(response.status).toBe(200);
    expect(response.body.pageSize).toBe(10);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].nome).toBe('Alice');
  });
});
