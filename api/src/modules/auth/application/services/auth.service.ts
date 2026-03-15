import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { PasswordHasher } from '../../infrastructure/security/password-hasher';
import { InjectDataSource } from '@nestjs/typeorm';

type AuthSession = {
  userId: string;
  empresaId?: string;
};

type EmpresaRow = {
  id: string;
  nome: string;
};

type UserLookupRow = {
  id: string;
  senha_hash: string;
  ativo: number;
};

type DepartamentoLookupRow = {
  id: string;
};

type UsuarioEmpresaRow = {
  usuario_id: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(PasswordHasher)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(input: {
    nome: string;
    email: string;
    senha: string;
    empresaId: string;
  }): Promise<{ userId: string }> {
    const nome = input.nome.trim();
    const email = input.email.trim().toLowerCase();
    const userId = randomUUID();
    const senhaHash = await this.passwordHasher.hash(input.senha);

    await this.dataSource.transaction(async (manager) => {
      const empresas = (await manager.query(
        `SELECT id FROM empresas WHERE id = ? LIMIT 1`,
        [input.empresaId],
      )) as unknown as Array<Pick<EmpresaRow, 'id'>>;

      if (empresas.length === 0) {
        throw new BadRequestException('Empresa nao encontrada');
      }

      const duplicate = (await manager.query(
        `SELECT id FROM usuarios WHERE email = ? LIMIT 1`,
        [email],
      )) as unknown as Array<Pick<UserLookupRow, 'id'>>;

      if (duplicate.length > 0) {
        throw new ConflictException('Email ja cadastrado');
      }

      await manager.query(
        `
        INSERT INTO usuarios (id, nome, email, senha_hash, ativo, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `,
        [userId, nome, email, senhaHash],
      );

      const departamentos = (await manager.query(
        `
        SELECT id
        FROM departamentos
        WHERE empresa_id = ?
        ORDER BY created_at ASC
        LIMIT 1
        `,
        [input.empresaId],
      )) as unknown as DepartamentoLookupRow[];

      const departamento = departamentos[0];

      if (!departamento) {
        throw new BadRequestException(
          'Empresa sem departamento para associar usuario',
        );
      }

      await manager.query(
        `
        INSERT INTO usuario_empresas (usuario_id, empresa_id, departamento_id, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `,
        [userId, input.empresaId, departamento.id],
      );
    });

    return { userId };
  }

  async listEmpresas(): Promise<Array<{ id: string; nome: string }>> {
    const rows = (await this.dataSource.query(
      `
      SELECT id, nome
      FROM empresas
      ORDER BY nome ASC
      `,
    )) as unknown as EmpresaRow[];

    return rows;
  }

  async login(input: {
    email: string;
    senha: string;
  }): Promise<{ userId: string }> {
    const email = input.email.trim().toLowerCase();
    const rows = (await this.dataSource.query(
      `
      SELECT id, senha_hash, ativo
      FROM usuarios
      WHERE email = ?
      LIMIT 1
      `,
      [email],
    )) as unknown as UserLookupRow[];

    const user = rows[0];

    if (!user || user.ativo !== 1) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordHasher.verify(
      input.senha,
      user.senha_hash,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { userId: user.id };
  }

  async listMinhasEmpresas(
    userId: string,
  ): Promise<Array<{ id: string; nome: string }>> {
    const rows = (await this.dataSource.query(
      `
      SELECT e.id, e.nome
      FROM empresas e
      INNER JOIN usuario_empresas ue ON ue.empresa_id = e.id
      WHERE ue.usuario_id = ?
      ORDER BY e.nome ASC
      `,
      [userId],
    )) as unknown as EmpresaRow[];

    return rows;
  }

  async selectEmpresa(input: {
    userId: string;
    empresaId: string;
  }): Promise<AuthSession> {
    const rows = (await this.dataSource.query(
      `
      SELECT usuario_id
      FROM usuario_empresas
      WHERE usuario_id = ? AND empresa_id = ?
      LIMIT 1
      `,
      [input.userId, input.empresaId],
    )) as unknown as UsuarioEmpresaRow[];

    if (rows.length === 0) {
      throw new ForbiddenException('Empresa nao permitida para este usuario');
    }

    return {
      userId: input.userId,
      empresaId: input.empresaId,
    };
  }

  getCurrentUser(session: AuthSession): AuthSession {
    return session;
  }
}
