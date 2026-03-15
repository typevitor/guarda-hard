import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { SessionTokenService } from '../../src/modules/auth/infrastructure/security/session-token.service';
import { Usuario } from '../../src/modules/usuarios/domain/entities/usuario.entity';
import { USUARIO_REPOSITORY } from '../../src/modules/usuarios/domain/repositories/usuario.repository.interface';
import { TenantContextInterceptor } from '../../src/shared/presentation/http/tenant-context.interceptor';
import { TenantContext } from '../../src/tenant/application/tenant-context';

const EMPRESA_ID = '11111111-1111-1111-1111-111111111111';
const DEPARTAMENTO_ID = '22222222-2222-4222-8222-222222222222';

class TenantAwareUsuarioRepository {
  constructor(private readonly tenantContext: TenantContext) {}

  async findById(): Promise<Usuario | null> {
    return null;
  }

  async findAll(): Promise<Usuario[]> {
    return [];
  }

  async listPaginated(query: { page: number; pageSize: 10 }) {
    const empresaId = this.tenantContext.requireEmpresaId();
    const usuario = Usuario.create({
      empresaId,
      departamentoId: DEPARTAMENTO_ID,
      nome: 'Alice',
      email: 'alice@example.com',
    });

    return {
      items: [usuario],
      page: query.page,
      pageSize: query.pageSize,
      total: 1,
      totalPages: 1,
    };
  }

  async save(): Promise<void> {}

  async delete(): Promise<void> {}
}

describe('Session phase protection API', () => {
  let app: INestApplication;
  let sessionTokenService: SessionTokenService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USUARIO_REPOSITORY)
      .useFactory({
        factory: (tenantContext: TenantContext) =>
          new TenantAwareUsuarioRepository(tenantContext),
        inject: [TenantContext],
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(
      new TenantContextInterceptor(app.get(TenantContext)),
    );
    await app.init();

    sessionTokenService = app.get(SessionTokenService);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  function createPhaseBCookie(): string {
    const token = sessionTokenService.sign({
      userId: 'phase-b-user',
      empresaId: EMPRESA_ID,
    });

    return `gh_session=${token}`;
  }

  it('accepts phase-B sessions on tenant-scoped listing endpoints', async () => {
    const phaseB = createPhaseBCookie();

    const response = await request(app.getHttpServer())
      .get('/usuarios')
      .set('Cookie', phaseB);

    if (response.status !== 200) {
      throw new Error(JSON.stringify(response.body));
    }

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].empresaId).toBe(EMPRESA_ID);
  });
});
