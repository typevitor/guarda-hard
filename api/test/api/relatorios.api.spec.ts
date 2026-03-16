import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import {
  HARDWARE_REPOSITORY,
  type IHardwareRepository,
} from '../../src/modules/hardwares/domain/repositories/hardware.repository.interface';
import { Hardware } from '../../src/modules/hardwares/domain/entities/hardware.entity';
import {
  EMPRESTIMO_REPOSITORY,
  type IEmprestimoRepository,
} from '../../src/modules/emprestimos/domain/repositories/emprestimo.repository.interface';
import { Emprestimo } from '../../src/modules/emprestimos/domain/entities/emprestimo.entity';
import { TenantContext } from '../../src/tenant/application/tenant-context';
import { TestTenantContext } from './test-tenant-context';

class InMemoryHardwareRepository implements IHardwareRepository {
  private readonly rows = new Map<string, Hardware>();
  private currentTenant = 'empresa-a';

  setCurrentTenant(tenant: string): void {
    this.currentTenant = tenant;
  }

  seed(entity: Hardware): void {
    this.rows.set(entity.id, entity);
  }

  async findById(id: string): Promise<Hardware | null> {
    const row = this.rows.get(id);
    if (!row || row.empresaId !== this.currentTenant) {
      return null;
    }

    return row;
  }

  async findAll(): Promise<Hardware[]> {
    return [...this.rows.values()].filter((row) => row.empresaId === this.currentTenant);
  }

  async listPaginated(query: {
    page: number;
    pageSize: 10;
    search?: string;
    funcionando?: boolean;
    livre?: boolean;
  }) {
    const filtered = [...this.rows.values()]
      .filter((row) => row.empresaId === this.currentTenant)
      .filter((row) =>
        query.search
          ? row.descricao.toLowerCase().includes(query.search.toLowerCase())
          : true,
      )
      .filter((row) =>
        query.funcionando !== undefined
          ? row.funcionando === query.funcionando
          : true,
      )
      .filter((row) => (query.livre !== undefined ? row.livre === query.livre : true));

    return {
      items: filtered,
      page: query.page,
      pageSize: 10 as const,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / 10),
    };
  }

  async listOptions(): Promise<
    Array<{
      id: string;
      descricao: string;
      marca: string;
      modelo: string;
      codigoPatrimonio: string;
    }>
  > {
    return [...this.rows.values()]
      .filter((row) => row.empresaId === this.currentTenant)
      .filter((row) => row.livre)
      .filter((row) => row.funcionando)
      .sort((a, b) => {
        const descricaoOrder = a.descricao
          .toLowerCase()
          .localeCompare(b.descricao.toLowerCase());
        if (descricaoOrder !== 0) {
          return descricaoOrder;
        }

        const marcaOrder = a.marca.toLowerCase().localeCompare(b.marca.toLowerCase());
        if (marcaOrder !== 0) {
          return marcaOrder;
        }

        const modeloOrder = a.modelo
          .toLowerCase()
          .localeCompare(b.modelo.toLowerCase());
        if (modeloOrder !== 0) {
          return modeloOrder;
        }

        return a.id.localeCompare(b.id);
      })
      .map((row) => ({
        id: row.id,
        descricao: row.descricao,
        marca: row.marca,
        modelo: row.modelo,
        codigoPatrimonio: row.codigoPatrimonio,
      }));
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

class InMemoryEmprestimoRepository implements IEmprestimoRepository {
  private readonly rows = new Map<string, Emprestimo>();
  private currentTenant = 'empresa-a';

  setCurrentTenant(tenant: string): void {
    this.currentTenant = tenant;
  }

  seed(entity: Emprestimo): void {
    this.rows.set(entity.id, entity);
  }

  async findById(id: string): Promise<Emprestimo | null> {
    const row = this.rows.get(id);
    if (!row || row.empresaId !== this.currentTenant) {
      return null;
    }

    return row;
  }

  async findAll(): Promise<Emprestimo[]> {
    return [...this.rows.values()].filter((row) => row.empresaId === this.currentTenant);
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
  }) {
    const filtered = [...this.rows.values()]
      .filter((row) => row.empresaId === this.currentTenant)
      .filter((row) => (query.usuarioId ? row.usuarioId === query.usuarioId : true))
      .filter((row) => (query.hardwareId ? row.hardwareId === query.hardwareId : true))
      .filter((row) =>
        query.status === 'open'
          ? row.dataDevolucao === null
          : query.status === 'returned'
            ? row.dataDevolucao !== null
            : true,
      );

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
    const row = this.rows.get(id);
    if (row && row.empresaId === this.currentTenant) {
      this.rows.delete(id);
    }
  }
}

describe('Relatorios API', () => {
  let app: INestApplication;
  let hardwareRepository: InMemoryHardwareRepository;
  let emprestimoRepository: InMemoryEmprestimoRepository;
  let tenantContext: TestTenantContext;

  beforeEach(async () => {
    hardwareRepository = new InMemoryHardwareRepository();
    emprestimoRepository = new InMemoryEmprestimoRepository();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HARDWARE_REPOSITORY)
      .useValue(hardwareRepository)
      .overrideProvider(EMPRESTIMO_REPOSITORY)
      .useValue(emprestimoRepository)
      .overrideProvider(TenantContext)
      .useClass(TestTenantContext)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    tenantContext = app.get(TenantContext);
  });

  it('filtra relatorio de situacao por status e respeita isolamento tenant', async () => {
    const hardwareDisponivel = Hardware.create({
      empresaId: 'empresa-a',
      descricao: 'Notebook disponivel',
      marca: 'Dell',
      modelo: 'Latitude',
      codigoPatrimonio: 'PAT-A-DISP',
    });

    const hardwareEmprestado = Hardware.create({
      empresaId: 'empresa-a',
      descricao: 'Notebook emprestado',
      marca: 'Dell',
      modelo: 'Vostro',
      codigoPatrimonio: 'PAT-A-LOAN',
    });
    hardwareEmprestado.emprestar();

    const hardwareDefeituoso = Hardware.create({
      empresaId: 'empresa-a',
      descricao: 'Notebook defeituoso',
      marca: 'Lenovo',
      modelo: 'ThinkPad',
      codigoPatrimonio: 'PAT-A-BROKEN',
    });
    hardwareDefeituoso.marcarDefeito('placa mae com problema');

    const hardwareEmpresaB = Hardware.create({
      empresaId: 'empresa-b',
      descricao: 'Desktop empresa b',
      marca: 'HP',
      modelo: 'ProDesk',
      codigoPatrimonio: 'PAT-B-DISP',
    });

    const emprestimoAtivo = Emprestimo.emprestar({
      empresaId: 'empresa-a',
      usuarioId: 'user-a',
      hardwareId: hardwareEmprestado.id,
      dataRetirada: new Date('2026-03-10T10:00:00.000Z'),
    });

    hardwareRepository.seed(hardwareDisponivel);
    hardwareRepository.seed(hardwareEmprestado);
    hardwareRepository.seed(hardwareDefeituoso);
    hardwareRepository.seed(hardwareEmpresaB);
    emprestimoRepository.seed(emprestimoAtivo);

    tenantContext.setEmpresaId('empresa-a');
    hardwareRepository.setCurrentTenant('empresa-a');
    emprestimoRepository.setCurrentTenant('empresa-a');

    const disponiveis = await request(app.getHttpServer()).get(
      '/relatorios/hardwares?status=disponivel',
    );

    expect(disponiveis.status).toBe(200);
    expect(disponiveis.body.total).toBe(1);
    expect(disponiveis.body.linhas[0].codigoPatrimonio).toBe('PAT-A-DISP');

    const emprestados = await request(app.getHttpServer()).get(
      '/relatorios/hardwares?status=emprestado',
    );

    expect(emprestados.status).toBe(200);
    expect(emprestados.body.total).toBe(1);
    expect(emprestados.body.linhas[0].codigoPatrimonio).toBe('PAT-A-LOAN');
    expect(emprestados.body.linhas[0].usuarioId).toBe('user-a');

    const defeituosos = await request(app.getHttpServer()).get(
      '/relatorios/hardwares?status=defeituoso',
    );

    expect(defeituosos.status).toBe(200);
    expect(defeituosos.body.total).toBe(1);
    expect(defeituosos.body.linhas[0].codigoPatrimonio).toBe('PAT-A-BROKEN');

    tenantContext.setEmpresaId('empresa-b');
    hardwareRepository.setCurrentTenant('empresa-b');
    emprestimoRepository.setCurrentTenant('empresa-b');

    const disponiveisEmpresaB = await request(app.getHttpServer()).get(
      '/relatorios/hardwares?status=disponivel',
    );

    expect(disponiveisEmpresaB.status).toBe(200);
    expect(disponiveisEmpresaB.body.total).toBe(1);
    expect(disponiveisEmpresaB.body.linhas[0].codigoPatrimonio).toBe('PAT-B-DISP');
  });

  it('retorna historico filtrado e exportacao csv com isolamento tenant', async () => {
    const hardwareDellA = Hardware.create({
      empresaId: 'empresa-a',
      descricao: 'Dell Latitude',
      marca: 'Dell',
      modelo: 'Latitude',
      codigoPatrimonio: 'PAT-A-1',
    });
    const hardwareLenovoA = Hardware.create({
      empresaId: 'empresa-a',
      descricao: 'Lenovo ThinkPad',
      marca: 'Lenovo',
      modelo: 'ThinkPad',
      codigoPatrimonio: 'PAT-A-2',
    });
    const hardwareDellB = Hardware.create({
      empresaId: 'empresa-b',
      descricao: 'Dell empresa b',
      marca: 'Dell',
      modelo: 'Vostro',
      codigoPatrimonio: 'PAT-B-1',
    });

    const emprestimoAna = Emprestimo.emprestar({
      empresaId: 'empresa-a',
      usuarioId: 'ana-001',
      hardwareId: hardwareDellA.id,
      dataRetirada: new Date('2026-03-05T10:00:00.000Z'),
    });
    emprestimoAna.devolver(new Date('2026-03-08T10:00:00.000Z'));

    const emprestimoJoao = Emprestimo.emprestar({
      empresaId: 'empresa-a',
      usuarioId: 'joao-002',
      hardwareId: hardwareLenovoA.id,
      dataRetirada: new Date('2026-04-10T10:00:00.000Z'),
    });

    const emprestimoEmpresaB = Emprestimo.emprestar({
      empresaId: 'empresa-b',
      usuarioId: 'maria-003',
      hardwareId: hardwareDellB.id,
      dataRetirada: new Date('2026-03-06T10:00:00.000Z'),
    });

    hardwareRepository.seed(hardwareDellA);
    hardwareRepository.seed(hardwareLenovoA);
    hardwareRepository.seed(hardwareDellB);
    emprestimoRepository.seed(emprestimoAna);
    emprestimoRepository.seed(emprestimoJoao);
    emprestimoRepository.seed(emprestimoEmpresaB);

    tenantContext.setEmpresaId('empresa-a');
    hardwareRepository.setCurrentTenant('empresa-a');
    emprestimoRepository.setCurrentTenant('empresa-a');

    const historico = await request(app.getHttpServer()).get(
      '/relatorios/emprestimos?periodoInicio=2026-03-01&periodoFim=2026-03-31&usuario=ana&hardware=dell',
    );

    expect(historico.status).toBe(200);
    expect(historico.body.total).toBe(1);
    expect(historico.body.linhas[0].usuarioId).toBe('ana-001');
    expect(historico.body.linhas[0].codigoPatrimonio).toBe('PAT-A-1');

    const csv = await request(app.getHttpServer()).get(
      '/relatorios/emprestimos/export.csv?periodoInicio=2026-03-01&periodoFim=2026-03-31&usuario=ana&hardware=dell',
    );

    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text).toContain('emprestimoId,hardwareId,descricao,codigoPatrimonio,usuarioId,dataRetirada,dataDevolucao');
    expect(csv.text).toContain('ana-001');

    tenantContext.setEmpresaId('empresa-b');
    hardwareRepository.setCurrentTenant('empresa-b');
    emprestimoRepository.setCurrentTenant('empresa-b');

    const historicoEmpresaB = await request(app.getHttpServer()).get('/relatorios/emprestimos');
    expect(historicoEmpresaB.status).toBe(200);
    expect(historicoEmpresaB.body.total).toBe(1);
    expect(historicoEmpresaB.body.linhas[0].usuarioId).toBe('maria-003');
  });
});
