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
  }) {
    const filtered = [...this.rows.values()]
      .filter((row) => row.empresaId === this.currentTenant)
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

describe('Hardwares listing API', () => {
  let app: INestApplication;
  let hardwareRepository: InMemoryHardwareRepository;
  let tenantContext: TestTenantContext;

  const buildHardware = (input: {
    id: string;
    empresaId: string;
    descricao: string;
    marca: string;
    modelo: string;
    codigoPatrimonio: string;
    funcionando: boolean;
    livre: boolean;
  }): Hardware => {
    return new Hardware({
      id: input.id,
      empresaId: input.empresaId,
      descricao: input.descricao,
      marca: input.marca,
      modelo: input.modelo,
      codigoPatrimonio: input.codigoPatrimonio,
      funcionando: input.funcionando,
      livre: input.livre,
      descricaoProblema: input.funcionando ? null : 'problema',
      version: 0,
      createdAt: new Date('2026-03-16T10:00:00.000Z'),
      updatedAt: new Date('2026-03-16T10:00:00.000Z'),
    });
  };

  beforeEach(async () => {
    hardwareRepository = new InMemoryHardwareRepository();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HARDWARE_REPOSITORY)
      .useValue(hardwareRepository)
      .overrideProvider(TenantContext)
      .useClass(TestTenantContext)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    tenantContext = app.get(TenantContext);
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

  it('lists only available options sorted by descricao/marca/modelo/id and isolated by tenant', async () => {
    const lendableTieA = buildHardware({
      id: '00000000-0000-0000-0000-000000000002',
      empresaId: 'empresa-a',
      descricao: 'Alpha',
      marca: 'Dell',
      modelo: 'A1',
      codigoPatrimonio: 'PAT-A-002',
      funcionando: true,
      livre: true,
    });
    const lendableTieB = buildHardware({
      id: '00000000-0000-0000-0000-000000000003',
      empresaId: 'empresa-a',
      descricao: 'alpha',
      marca: 'dell',
      modelo: 'A1',
      codigoPatrimonio: 'PAT-A-003',
      funcionando: true,
      livre: true,
    });
    const lendableAfter = buildHardware({
      id: '00000000-0000-0000-0000-000000000001',
      empresaId: 'empresa-a',
      descricao: 'Beta',
      marca: 'Acer',
      modelo: 'B1',
      codigoPatrimonio: 'PAT-A-001',
      funcionando: true,
      livre: true,
    });

    const occupied = buildHardware({
      id: '00000000-0000-0000-0000-000000000004',
      empresaId: 'empresa-a',
      descricao: 'Occupied',
      marca: 'Lenovo',
      modelo: 'L1',
      codigoPatrimonio: 'PAT-A-004',
      funcionando: true,
      livre: false,
    });
    const brokenFree = buildHardware({
      id: '00000000-0000-0000-0000-000000000005',
      empresaId: 'empresa-a',
      descricao: 'BrokenFree',
      marca: 'Lenovo',
      modelo: 'L2',
      codigoPatrimonio: 'PAT-A-005',
      funcionando: false,
      livre: true,
    });
    const brokenOccupied = buildHardware({
      id: '00000000-0000-0000-0000-000000000006',
      empresaId: 'empresa-a',
      descricao: 'BrokenOccupied',
      marca: 'Lenovo',
      modelo: 'L3',
      codigoPatrimonio: 'PAT-A-006',
      funcionando: false,
      livre: false,
    });

    const tenantBOption = buildHardware({
      id: '00000000-0000-0000-0000-000000000007',
      empresaId: 'empresa-b',
      descricao: 'Tenant B option',
      marca: 'HP',
      modelo: 'P1',
      codigoPatrimonio: 'PAT-B-001',
      funcionando: true,
      livre: true,
    });

    hardwareRepository.seed(lendableTieA);
    hardwareRepository.seed(lendableTieB);
    hardwareRepository.seed(lendableAfter);
    hardwareRepository.seed(occupied);
    hardwareRepository.seed(brokenFree);
    hardwareRepository.seed(brokenOccupied);
    hardwareRepository.seed(tenantBOption);

    tenantContext.setEmpresaId('empresa-a');
    hardwareRepository.setCurrentTenant('empresa-a');

    const empresaAResponse = await request(app.getHttpServer()).get(
      '/hardwares/options',
    );

    expect(empresaAResponse.status).toBe(200);
    expect(empresaAResponse.body.map((row: { id: string }) => row.id)).toEqual([
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000001',
    ]);

    tenantContext.setEmpresaId('empresa-b');
    hardwareRepository.setCurrentTenant('empresa-b');

    const empresaBResponse = await request(app.getHttpServer()).get(
      '/hardwares/options',
    );

    expect(empresaBResponse.status).toBe(200);
    expect(empresaBResponse.body.map((row: { id: string }) => row.id)).toEqual([
      '00000000-0000-0000-0000-000000000007',
    ]);
  });
});
