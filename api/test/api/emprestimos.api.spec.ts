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
  private currentTenant = 'empresa-a';

  setCurrentTenant(tenant: string): void {
    this.currentTenant = tenant;
  }

  async findById(id: string): Promise<Emprestimo | null> {
    const row = this.rows.get(id);
    if (!row || row.empresaId !== this.currentTenant) {
      return null;
    }

    return row;
  }

  async findAll(): Promise<Emprestimo[]> {
    return [...this.rows.values()].filter(
      (row) => row.empresaId === this.currentTenant,
    );
  }

  async listPaginated(query: {
    page: number;
    pageSize: 10;
    search?: string;
    usuarioId?: string;
    hardwareId?: string;
    retiradaFrom?: string;
    retiradaTo?: string;
    devolucaoFrom?: string;
    devolucaoTo?: string;
    status?: 'open' | 'returned';
  }): Promise<{
    items: Emprestimo[];
    page: number;
    pageSize: 10;
    total: number;
    totalPages: number;
  }> {
    const filtered = (await this.findAll())
      .filter((row) =>
        query.status === 'open' ? row.dataDevolucao === null : true,
      )
      .filter((row) =>
        query.status === 'returned' ? row.dataDevolucao !== null : true,
      )
      .filter((row) => (query.usuarioId ? row.usuarioId === query.usuarioId : true))
      .filter((row) =>
        query.hardwareId ? row.hardwareId === query.hardwareId : true,
      )
      .filter((row) => {
        if (!query.retiradaFrom) {
          return true;
        }

        return row.dataRetirada >= new Date(query.retiradaFrom);
      })
      .filter((row) => {
        if (!query.retiradaTo) {
          return true;
        }

        return row.dataRetirada <= new Date(query.retiradaTo);
      })
      .filter((row) => {
        if (!query.devolucaoFrom) {
          return true;
        }

        return row.dataDevolucao ? row.dataDevolucao >= new Date(query.devolucaoFrom) : false;
      })
      .filter((row) => {
        if (!query.devolucaoTo) {
          return true;
        }

        return row.dataDevolucao ? row.dataDevolucao <= new Date(query.devolucaoTo) : false;
      });

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

  async save(entity: Emprestimo): Promise<void> {
    this.rows.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row && row.empresaId === this.currentTenant) {
      this.rows.delete(id);
    }
  }
}

class InMemoryHardwareRepository {
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

  async listPaginated(): Promise<{
    items: Hardware[];
    page: number;
    pageSize: 10;
    total: number;
    totalPages: number;
  }> {
    return {
      items: await this.findAll(),
      page: 1,
      pageSize: 10,
      total: this.rows.size,
      totalPages: Math.ceil(this.rows.size / 10),
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

  seed(entity: Hardware): void {
    this.rows.set(entity.id, entity);
  }
}

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

  async listPaginated(): Promise<{
    items: Usuario[];
    page: number;
    pageSize: 10;
    total: number;
    totalPages: number;
  }> {
    return {
      items: await this.findAll(),
      page: 1,
      pageSize: 10,
      total: this.rows.size,
      totalPages: Math.ceil(this.rows.size / 10),
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

  seed(entity: Usuario): void {
    this.rows.set(entity.id, entity);
  }
}

describe('Emprestimos API', () => {
  let app: INestApplication;
  let emprestimoRepo: InMemoryEmprestimoRepository;
  let hardwareRepo: InMemoryHardwareRepository;
  let usuarioRepo: InMemoryUsuarioRepository;
  let tenantContext: TestTenantContext;

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

    tenantContext = app.get(TenantContext);
  });

  it('supports emprestimo, devolucao and cross-tenant isolation', async () => {
    const usuarioA = Usuario.create({
      empresaId: 'empresa-a',
      departamentoId: '77eb2218-c1c1-4a43-ac8b-fb339eca8fcd',
      nome: 'Alice',
      email: 'alice@empresa-a.test',
    });
    const hardwareA = Hardware.create({
      empresaId: 'empresa-a',
      descricao: 'Notebook',
      marca: 'Dell',
      modelo: 'Latitude',
      codigoPatrimonio: 'PAT-A',
    });
    const usuarioB = Usuario.create({
      empresaId: 'empresa-b',
      departamentoId: '2cbc4f56-8c44-435a-9d06-b05f00fe5ecf',
      nome: 'Bob',
      email: 'bob@empresa-b.test',
    });

    usuarioRepo.seed(usuarioA);
    usuarioRepo.seed(usuarioB);
    hardwareRepo.seed(hardwareA);

    tenantContext.setEmpresaId('empresa-b');
    emprestimoRepo.setCurrentTenant('empresa-b');
    hardwareRepo.setCurrentTenant('empresa-b');
    usuarioRepo.setCurrentTenant('empresa-b');

    const crossTenantEmprestimo = await request(app.getHttpServer())
      .post('/emprestimos')
      .send({ usuarioId: usuarioB.id, hardwareId: hardwareA.id });
    expect(crossTenantEmprestimo.status).toBe(404);

    tenantContext.setEmpresaId('empresa-a');
    emprestimoRepo.setCurrentTenant('empresa-a');
    hardwareRepo.setCurrentTenant('empresa-a');
    usuarioRepo.setCurrentTenant('empresa-a');

    const create = await request(app.getHttpServer())
      .post('/emprestimos')
      .send({
        usuarioId: usuarioA.id,
        hardwareId: hardwareA.id,
      });
    expect(create.status).toBe(201);
    expect(create.body.dataDevolucao).toBeNull();

    const second = await request(app.getHttpServer())
      .post('/emprestimos')
      .send({
        usuarioId: usuarioA.id,
        hardwareId: hardwareA.id,
      });
    expect(second.status).toBe(409);

    const devolucao = await request(app.getHttpServer()).post(
      `/emprestimos/${create.body.id}/devolucao`,
    );
    expect(devolucao.status).toBe(201);
    expect(devolucao.body.dataDevolucao).not.toBeNull();

    const devolucaoDuplicada = await request(app.getHttpServer()).post(
      `/emprestimos/${create.body.id}/devolucao`,
    );
    expect(devolucaoDuplicada.status).toBe(409);

    tenantContext.setEmpresaId('empresa-b');
    emprestimoRepo.setCurrentTenant('empresa-b');
    hardwareRepo.setCurrentTenant('empresa-b');
    usuarioRepo.setCurrentTenant('empresa-b');

    const crossTenantDevolucao = await request(app.getHttpServer()).post(
      `/emprestimos/${create.body.id}/devolucao`,
    );
    expect(crossTenantDevolucao.status).toBe(404);
  });
});
