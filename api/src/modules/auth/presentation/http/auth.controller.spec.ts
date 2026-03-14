import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { App } from 'supertest/types';
import { AppModule } from '../../../../app.module';
import { AuthService } from '../../application/services/auth.service';
import { ApiErrorFilter } from '../../../../shared/presentation/http/api-error.filter';

type RegisteredUser = {
  id: string;
  nome: string;
  email: string;
  senha: string;
};

class InMemoryAuthService {
  private readonly empresas = [
    { id: '11111111-1111-1111-1111-111111111111', nome: 'Test company' },
    { id: '22222222-2222-2222-2222-222222222222', nome: 'Second company' },
  ];

  private readonly users = new Map<string, RegisteredUser>();
  private readonly membershipByUser = new Map<string, Set<string>>();
  private nextId = 1;

  listEmpresas(): Promise<Array<{ id: string; nome: string }>> {
    return Promise.resolve(this.empresas);
  }

  register(input: {
    nome: string;
    email: string;
    senha: string;
    empresaId: string;
  }): Promise<{ userId: string }> {
    const empresaExists = this.empresas.some(
      (empresa) => empresa.id === input.empresaId,
    );

    if (!empresaExists) {
      throw new BadRequestException('Empresa nao encontrada');
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const duplicated = [...this.users.values()].some(
      (user) => user.email === normalizedEmail,
    );

    if (duplicated) {
      throw new ConflictException('Email ja cadastrado');
    }

    const userId = `user-${this.nextId++}`;
    this.users.set(userId, {
      id: userId,
      nome: input.nome,
      email: normalizedEmail,
      senha: input.senha,
    });

    this.membershipByUser.set(userId, new Set([input.empresaId]));

    return Promise.resolve({ userId });
  }

  login(input: { email: string; senha: string }): Promise<{ userId: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = [...this.users.values()].find(
      (candidate) => candidate.email === normalizedEmail,
    );

    if (!user || user.senha !== input.senha) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return Promise.resolve({ userId: user.id });
  }

  listMinhasEmpresas(
    userId: string,
  ): Promise<Array<{ id: string; nome: string }>> {
    const memberships = this.membershipByUser.get(userId) ?? new Set<string>();

    return Promise.resolve(
      this.empresas.filter((empresa) => memberships.has(empresa.id)),
    );
  }

  selectEmpresa(input: {
    userId: string;
    empresaId: string;
  }): Promise<{ userId: string; empresaId: string }> {
    const memberships =
      this.membershipByUser.get(input.userId) ?? new Set<string>();

    if (!memberships.has(input.empresaId)) {
      throw new ForbiddenException('Empresa nao permitida para este usuario');
    }

    return Promise.resolve({
      userId: input.userId,
      empresaId: input.empresaId,
    });
  }

  getCurrentUser(session: { userId: string; empresaId?: string }): {
    userId: string;
    empresaId?: string;
  } {
    return session;
  }
}

describe('AuthController', () => {
  let app: INestApplication;
  let httpServer: App;
  let authService: InMemoryAuthService;

  beforeEach(async () => {
    authService = new InMemoryAuthService();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(authService)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiErrorFilter());
    await app.init();
    httpServer = app.getHttpServer() as App;
  });

  it('GET /auth/empresas lists public empresas', async () => {
    const response = await request(httpServer).get('/auth/empresas');
    const body = response.body as {
      items: Array<{ id: string; nome: string }>;
    };

    expect(response.status).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items[0]).toHaveProperty('id');
    expect(body.items[0]).toHaveProperty('nome');
  });

  it('POST /auth/register rejects senha/confirmar mismatch', async () => {
    const response = await request(httpServer).post('/auth/register').send({
      nome: 'Novo Usuario',
      email: 'novo@example.com',
      senha: '12345678',
      confirmarSenha: '87654321',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    expect(response.status).toBe(400);
  });

  it('register rejects unknown empresaId', async () => {
    const response = await request(httpServer).post('/auth/register').send({
      nome: 'Novo Usuario',
      email: 'unknown-empresa@example.com',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '99999999-9999-9999-9999-999999999999',
    });

    expect(response.status).toBe(400);
  });

  it('POST /auth/login returns phase-A session cookie', async () => {
    await request(httpServer).post('/auth/register').send({
      nome: 'Usuario Login',
      email: 'login@example.com',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    const response = await request(httpServer).post('/auth/login').send({
      email: 'login@example.com',
      senha: '12345678',
    });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
    expect(String(response.headers['set-cookie']?.[0] ?? '')).toContain(
      'gh_session=',
    );
  });

  it('login returns generic invalid credentials error', async () => {
    const response = await request(httpServer).post('/auth/login').send({
      email: 'missing@example.com',
      senha: 'wrong-pass',
    });

    expect(response.status).toBe(401);
    const body = response.body as { message: string };
    expect(body.message).toBe('Invalid credentials');
  });

  it('login cookie includes security flags', async () => {
    await request(httpServer).post('/auth/register').send({
      nome: 'Usuario Cookie',
      email: 'cookie@example.com',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    const response = await request(httpServer).post('/auth/login').send({
      email: 'cookie@example.com',
      senha: '12345678',
    });

    const cookie = String(response.headers['set-cookie']?.[0] ?? '');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('register rejects duplicate global email with 409', async () => {
    await request(httpServer).post('/auth/register').send({
      nome: 'Usuario Duplicado',
      email: 'duplicate@example.com',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    const duplicate = await request(httpServer).post('/auth/register').send({
      nome: 'Outro Usuario',
      email: 'duplicate@example.com',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    expect(duplicate.status).toBe(409);
  });

  it('register normalizes email before persistence', async () => {
    await request(httpServer).post('/auth/register').send({
      nome: 'Usuario Normalizado',
      email: '  USER@Example.COM  ',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    const login = await request(httpServer).post('/auth/login').send({
      email: 'user@example.com',
      senha: '12345678',
    });

    expect(login.status).toBe(200);
  });

  it('GET /auth/minhas-empresas returns only membership companies', async () => {
    await request(httpServer).post('/auth/register').send({
      nome: 'Usuario Membership',
      email: 'membership@example.com',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    const login = await request(httpServer).post('/auth/login').send({
      email: 'membership@example.com',
      senha: '12345678',
    });

    const cookie = login.headers['set-cookie']?.[0];
    const response = await request(httpServer)
      .get('/auth/minhas-empresas')
      .set('Cookie', cookie);
    const body = response.body as {
      items: Array<{ id: string; nome: string }>;
    };

    expect(response.status).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items).toHaveLength(1);
  });

  it('POST /auth/select-empresa upgrades session to phase-B', async () => {
    await request(httpServer).post('/auth/register').send({
      nome: 'Usuario Select',
      email: 'select@example.com',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    const login = await request(httpServer).post('/auth/login').send({
      email: 'select@example.com',
      senha: '12345678',
    });

    const cookie = login.headers['set-cookie']?.[0];
    const response = await request(httpServer)
      .post('/auth/select-empresa')
      .set('Cookie', cookie)
      .send({ empresaId: '11111111-1111-1111-1111-111111111111' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('select-empresa rejects non-member company with TENANT_FORBIDDEN', async () => {
    await request(httpServer).post('/auth/register').send({
      nome: 'Usuario Forbidden',
      email: 'forbidden@example.com',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    const login = await request(httpServer).post('/auth/login').send({
      email: 'forbidden@example.com',
      senha: '12345678',
    });

    const cookie = login.headers['set-cookie']?.[0];
    const response = await request(httpServer)
      .post('/auth/select-empresa')
      .set('Cookie', cookie)
      .send({ empresaId: '22222222-2222-2222-2222-222222222222' });

    expect(response.status).toBe(403);
    const body = response.body as { code: string };
    expect(body.code).toBe('TENANT_FORBIDDEN');
  });

  it('GET /auth/me includes empresaId in phase-B', async () => {
    await request(httpServer).post('/auth/register').send({
      nome: 'Usuario Me',
      email: 'me@example.com',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    const login = await request(httpServer).post('/auth/login').send({
      email: 'me@example.com',
      senha: '12345678',
    });

    const phaseA = login.headers['set-cookie']?.[0];
    const select = await request(httpServer)
      .post('/auth/select-empresa')
      .set('Cookie', phaseA)
      .send({ empresaId: '11111111-1111-1111-1111-111111111111' });

    const phaseB = select.headers['set-cookie']?.[0];
    const me = await request(httpServer).get('/auth/me').set('Cookie', phaseB);

    expect(me.status).toBe(200);
    expect(me.body).toHaveProperty('id');
    expect(me.body).toHaveProperty(
      'empresaId',
      '11111111-1111-1111-1111-111111111111',
    );
  });

  it('POST /auth/logout clears cookie', async () => {
    const response = await request(httpServer).post('/auth/logout');

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('rejects phase-A on tenant-scoped operational endpoint', async () => {
    await request(httpServer).post('/auth/register').send({
      nome: 'Usuario Operacao',
      email: 'operacao@example.com',
      senha: '12345678',
      confirmarSenha: '12345678',
      empresaId: '11111111-1111-1111-1111-111111111111',
    });

    const login = await request(httpServer).post('/auth/login').send({
      email: 'operacao@example.com',
      senha: '12345678',
    });

    const phaseA = login.headers['set-cookie']?.[0];
    const response = await request(httpServer)
      .post('/departamentos')
      .set('Cookie', phaseA)
      .send({ nome: 'Financeiro' });

    expect(response.status).toBe(401);
    const body = response.body as { code: string };
    expect(body.code).toBe('AUTH_REQUIRED');
  });
});
