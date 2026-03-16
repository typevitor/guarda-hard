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

  async listOptions(): Promise<Array<{ id: string; nome: string }>> {
    return (await this.findAll())
      .map((row) => ({ id: row.id, nome: row.nome }))
      .sort((a, b) => {
        const byName = a.nome.toLowerCase().localeCompare(b.nome.toLowerCase());
        if (byName !== 0) {
          return byName;
        }

        return a.id.localeCompare(b.id);
      });
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
  let tenantContext: TestTenantContext;
  let repository: InMemoryUsuarioRepository;

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

  it('returns tenant-scoped usuario options sorted by nome', async () => {
    await repository.save(
      new Usuario({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        empresaId: 'empresa-a',
        departamentoId: null,
        nome: 'ALICE',
        email: 'alice-2@empresa-a.test',
        senhaHash: 'hash',
        ativo: true,
      }),
    );
    await repository.save(
      new Usuario({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        empresaId: 'empresa-a',
        departamentoId: null,
        nome: 'alice',
        email: 'alice-1@empresa-a.test',
        senhaHash: 'hash',
        ativo: true,
      }),
    );
    await repository.save(
      new Usuario({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        empresaId: 'empresa-a',
        departamentoId: null,
        nome: 'Bruno',
        email: 'bruno@empresa-a.test',
        senhaHash: 'hash',
        ativo: true,
      }),
    );
    await repository.save(
      new Usuario({
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        empresaId: 'empresa-b',
        departamentoId: null,
        nome: 'alice',
        email: 'alice@empresa-b.test',
        senhaHash: 'hash',
        ativo: true,
      }),
    );
    await repository.save(
      new Usuario({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        empresaId: 'empresa-b',
        departamentoId: null,
        nome: 'Carlos',
        email: 'carlos@empresa-b.test',
        senhaHash: 'hash',
        ativo: true,
      }),
    );

    tenantContext.setEmpresaId('empresa-a');
    repository.setCurrentTenant('empresa-a');

    const responseA = await request(app.getHttpServer()).get('/usuarios/options');

    expect(responseA.status).toBe(200);
    expect(responseA.body).toEqual([
      { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', nome: 'alice' },
      { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', nome: 'ALICE' },
      { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', nome: 'Bruno' },
    ]);

    tenantContext.setEmpresaId('empresa-b');
    repository.setCurrentTenant('empresa-b');

    const responseB = await request(app.getHttpServer()).get('/usuarios/options');

    expect(responseB.status).toBe(200);
    expect(responseB.body).toEqual([
      { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', nome: 'alice' },
      { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', nome: 'Carlos' },
    ]);
  });
});
