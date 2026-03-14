import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { EMPRESTIMO_REPOSITORY } from '../../src/modules/emprestimos/domain/repositories/emprestimo.repository.interface';
import { Emprestimo } from '../../src/modules/emprestimos/domain/entities/emprestimo.entity';
import { HARDWARE_REPOSITORY } from '../../src/modules/hardwares/domain/repositories/hardware.repository.interface';
import { Hardware } from '../../src/modules/hardwares/domain/entities/hardware.entity';
import { USUARIO_REPOSITORY } from '../../src/modules/usuarios/domain/repositories/usuario.repository.interface';
import { Usuario } from '../../src/modules/usuarios/domain/entities/usuario.entity';
import { TenantContext } from '../../src/tenant/application/tenant-context';
import { TestTenantContext } from './test-tenant-context';

class InMemoryEmprestimoRepository {
  private readonly rows = new Map<string, Emprestimo>();

  async findById(id: string): Promise<Emprestimo | null> {
    return this.rows.get(id) ?? null;
  }

  async findAll(): Promise<Emprestimo[]> {
    return [...this.rows.values()];
  }

  async listPaginated(query: {
    page: number;
    pageSize: 10;
    status?: 'open' | 'returned';
    usuarioId?: string;
    hardwareId?: string;
  }) {
    const filtered = [...this.rows.values()]
      .filter((row) => (query.status === 'open' ? row.dataDevolucao === null : true))
      .filter((row) => (query.status === 'returned' ? row.dataDevolucao !== null : true))
      .filter((row) => (query.usuarioId ? row.usuarioId === query.usuarioId : true))
      .filter((row) => (query.hardwareId ? row.hardwareId === query.hardwareId : true));

    return {
      items: filtered,
      page: query.page,
      pageSize: 10 as const,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / 10),
    };
  }

  async save(entity: Emprestimo): Promise<void> {
    this.rows.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

class InMemoryHardwareRepository {
  private readonly rows = new Map<string, Hardware>();

  async findById(id: string): Promise<Hardware | null> {
    return this.rows.get(id) ?? null;
  }

  async findAll(): Promise<Hardware[]> {
    return [...this.rows.values()];
  }

  async listPaginated() {
    return { items: [], page: 1, pageSize: 10 as const, total: 0, totalPages: 0 };
  }

  async save(entity: Hardware): Promise<void> {
    this.rows.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }

  seed(entity: Hardware): void {
    this.rows.set(entity.id, entity);
  }
}

class InMemoryUsuarioRepository {
  private readonly rows = new Map<string, Usuario>();

  async findById(id: string): Promise<Usuario | null> {
    return this.rows.get(id) ?? null;
  }

  async findAll(): Promise<Usuario[]> {
    return [...this.rows.values()];
  }

  async listPaginated() {
    return { items: [], page: 1, pageSize: 10 as const, total: 0, totalPages: 0 };
  }

  async save(entity: Usuario): Promise<void> {
    this.rows.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }

  seed(entity: Usuario): void {
    this.rows.set(entity.id, entity);
  }
}

describe('Emprestimos listing API', () => {
  let app: INestApplication;
  let emprestimoRepo: InMemoryEmprestimoRepository;
  let hardwareRepo: InMemoryHardwareRepository;
  let usuarioRepo: InMemoryUsuarioRepository;

  beforeEach(async () => {
    emprestimoRepo = new InMemoryEmprestimoRepository();
    hardwareRepo = new InMemoryHardwareRepository();
    usuarioRepo = new InMemoryUsuarioRepository();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMPRESTIMO_REPOSITORY)
      .useValue(emprestimoRepo)
      .overrideProvider(HARDWARE_REPOSITORY)
      .useValue(hardwareRepo)
      .overrideProvider(USUARIO_REPOSITORY)
      .useValue(usuarioRepo)
      .overrideProvider(TenantContext)
      .useClass(TestTenantContext)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('lists open and returned emprestimos through status filter', async () => {
    const usuario = Usuario.create({
      empresaId: 'empresa-a',
      departamentoId: '2cbc4f56-8c44-435a-9d06-b05f00fe5ecf',
      nome: 'Alice',
      email: 'alice@empresa.test',
      senhaHash: 'hash-a',
    });
    const hardware = Hardware.create({
      empresaId: 'empresa-a',
      descricao: 'Notebook',
      marca: 'Dell',
      modelo: 'Latitude',
      codigoPatrimonio: 'PAT-A',
    });

    usuarioRepo.seed(usuario);
    hardwareRepo.seed(hardware);

    const created = await request(app.getHttpServer()).post('/emprestimos').send({
      usuarioId: usuario.id,
      hardwareId: hardware.id,
    });
    expect(created.status).toBe(201);

    const openResponse = await request(app.getHttpServer()).get('/emprestimos?status=open');
    expect(openResponse.status).toBe(200);
    expect(openResponse.body.pageSize).toBe(10);
    expect(openResponse.body.items).toHaveLength(1);

    await request(app.getHttpServer()).post(`/emprestimos/${created.body.id}/devolucao`);

    const returnedResponse = await request(app.getHttpServer()).get('/emprestimos?status=returned');
    expect(returnedResponse.status).toBe(200);
    expect(returnedResponse.body.items).toHaveLength(1);
  });
});
