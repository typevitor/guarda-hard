import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { USUARIO_REPOSITORY } from '../../src/modules/usuarios/domain/repositories/usuario.repository.interface';
import { Usuario } from '../../src/modules/usuarios/domain/entities/usuario.entity';
import { TenantContext } from '../../src/tenant/application/tenant-context';
import { TestTenantContext } from './test-tenant-context';

type UsuarioRepo = {
  findById(id: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  listPaginated(query: {
    page: number;
    pageSize: 10;
    search?: string;
    departamentoId?: string;
    ativo?: boolean;
  }): Promise<{
    items: Usuario[];
    page: number;
    pageSize: 10;
    total: number;
    totalPages: number;
  }>;
  save(entity: Usuario): Promise<void>;
  delete(id: string): Promise<void>;
};

class InMemoryUsuarioRepository implements UsuarioRepo {
  private readonly rows = new Map<string, Usuario>();
  private currentTenant = 'empresa-a';

  setCurrentTenant(tenant: string): void {
    this.currentTenant = tenant;
  }

  async findById(id: string): Promise<Usuario | null> {
    const row = this.rows.get(id);
    if (!row || row.empresaId !== this.currentTenant) {
      return null;
    }

    return row;
  }

  async findAll(): Promise<Usuario[]> {
    return [...this.rows.values()].filter(
      (row) => row.empresaId === this.currentTenant,
    );
  }

  async listPaginated(query: {
    page: number;
    pageSize: 10;
    search?: string;
    departamentoId?: string;
    ativo?: boolean;
  }): Promise<{
    items: Usuario[];
    page: number;
    pageSize: 10;
    total: number;
    totalPages: number;
  }> {
    const filtered = (await this.findAll())
      .filter((row) =>
        query.search
          ? row.nome.toLowerCase().includes(query.search.toLowerCase())
          : true,
      )
      .filter((row) =>
        query.departamentoId ? row.departamentoId === query.departamentoId : true,
      )
      .filter((row) => (query.ativo !== undefined ? row.ativo === query.ativo : true));

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

  async save(entity: Usuario): Promise<void> {
    this.rows.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row && row.empresaId === this.currentTenant) {
      this.rows.delete(id);
    }
  }
}

describe('Usuarios API', () => {
  let app: INestApplication;
  let repository: InMemoryUsuarioRepository;
  let tenantContext: TestTenantContext;

  beforeEach(async () => {
    repository = new InMemoryUsuarioRepository();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USUARIO_REPOSITORY)
      .useValue(repository)
      .overrideProvider(TenantContext)
      .useClass(TestTenantContext)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    tenantContext = app.get(TenantContext);
  });

  it('implements CRUD and cross-tenant isolation', async () => {
    tenantContext.setEmpresaId('empresa-a');
    repository.setCurrentTenant('empresa-a');

    const createA = await request(app.getHttpServer()).post('/usuarios').send({
      departamentoId: '2c22959a-720d-4cf6-b4f9-5d6f42880d2b',
      nome: 'Alice',
      email: 'alice@empresa-a.test',
      senhaHash: 'hash-a',
    });

    expect(createA.status).toBe(201);
    const createdId = createA.body.id as string;

    tenantContext.setEmpresaId('empresa-b');
    repository.setCurrentTenant('empresa-b');

    const createB = await request(app.getHttpServer()).post('/usuarios').send({
      departamentoId: 'c923fb33-81b1-4565-8f74-c87f2ffbcd0b',
      nome: 'Bob',
      email: 'bob@empresa-b.test',
      senhaHash: 'hash-b',
    });

    expect(createB.status).toBe(201);

    const listB = await request(app.getHttpServer()).get('/usuarios');
    expect(listB.status).toBe(200);
    expect(listB.body.items).toHaveLength(1);
    expect(listB.body.items[0].nome).toBe('Bob');

    const getCrossTenant = await request(app.getHttpServer()).get(
      `/usuarios/${createdId}`,
    );
    expect(getCrossTenant.status).toBe(404);

    const patchCrossTenant = await request(app.getHttpServer())
      .patch(`/usuarios/${createdId}`)
      .send({ nome: 'Nao atualiza' });
    expect(patchCrossTenant.status).toBe(404);

    tenantContext.setEmpresaId('empresa-a');
    repository.setCurrentTenant('empresa-a');

    const patchA = await request(app.getHttpServer())
      .patch(`/usuarios/${createdId}`)
      .send({ nome: 'Alice N2', ativo: false });
    expect(patchA.status).toBe(200);
    expect(patchA.body.nome).toBe('Alice N2');
    expect(patchA.body.ativo).toBe(false);

    const getA = await request(app.getHttpServer()).get(
      `/usuarios/${createdId}`,
    );
    expect(getA.status).toBe(200);

    const deleteA = await request(app.getHttpServer()).delete(
      `/usuarios/${createdId}`,
    );
    expect(deleteA.status).toBe(204);

    const getDeleted = await request(app.getHttpServer()).get(
      `/usuarios/${createdId}`,
    );
    expect(getDeleted.status).toBe(404);
  });
});
