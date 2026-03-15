// api/src/modules/usuarios/infrastructure/persistence/usuario.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  IUsuarioRepository,
  type PaginatedUsuarios,
  type UsuarioListQuery,
} from '../../domain/repositories/usuario.repository.interface';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioOrmEntity } from './usuario.orm-entity';
import { UsuarioMapper } from './usuario.mapper';
import { TenantContext } from '../../../../tenant/application/tenant-context';
import { InjectDataSource } from '@nestjs/typeorm';

type UsuarioJoinedRow = {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  ativo: number | boolean;
  created_at: string | Date;
  updated_at: string | Date;
  empresa_id: string;
  departamento_id: string;
};

type UsuarioMembershipRow = {
  usuario_id: string;
  empresa_id: string;
  departamento_id: string;
};

@Injectable()
export class TypeOrmUsuarioRepository implements IUsuarioRepository {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly ormRepo: Repository<UsuarioOrmEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async findById(id: string): Promise<Usuario | null> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const row = await this.getMembershipByUsuarioId(empresaId, id);

    if (!row) {
      return null;
    }

    const orm = await this.ormRepo.findOne({ where: { id } });
    if (!orm) {
      return null;
    }

    return UsuarioMapper.toDomain({
      orm,
      empresaId: row.empresa_id,
      departamentoId: row.departamento_id,
    });
  }

  async findAll(): Promise<Usuario[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const rows = await this.ormRepo
      .createQueryBuilder('usuario')
      .innerJoin(
        'usuario_empresas',
        'ue',
        'ue.usuario_id = usuario.id AND ue.empresa_id = :empresaId',
        { empresaId },
      )
      .select('usuario.id', 'id')
      .addSelect('usuario.nome', 'nome')
      .addSelect('usuario.email', 'email')
      .addSelect('usuario.senha_hash', 'senha_hash')
      .addSelect('usuario.ativo', 'ativo')
      .addSelect('usuario.created_at', 'created_at')
      .addSelect('usuario.updated_at', 'updated_at')
      .addSelect('ue.empresa_id', 'empresa_id')
      .addSelect('ue.departamento_id', 'departamento_id')
      .orderBy('usuario.created_at', 'DESC')
      .addOrderBy('usuario.id', 'DESC')
      .getRawMany<UsuarioJoinedRow>();

    return rows.map((row) =>
      UsuarioMapper.toDomain({
        orm: {
          id: row.id,
          nome: row.nome,
          email: row.email,
          senha_hash: row.senha_hash,
          ativo: row.ativo === true || row.ativo === 1,
          created_at: new Date(row.created_at),
          updated_at: new Date(row.updated_at),
        } as UsuarioOrmEntity,
        empresaId: row.empresa_id,
        departamentoId: row.departamento_id,
      }),
    );
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const orm = await this.ormRepo.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!orm) {
      return null;
    }

    const empresaId = this.tenantContext.requireEmpresaId();
    const row = await this.getMembershipByUsuarioId(empresaId, orm.id);
    if (!row) {
      return null;
    }

    return UsuarioMapper.toDomain({
      orm,
      empresaId: row.empresa_id,
      departamentoId: row.departamento_id,
    });
  }

  async listPaginated(query: UsuarioListQuery): Promise<PaginatedUsuarios> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const page = query.page;
    const pageSize = 10;

    const qb = this.ormRepo
      .createQueryBuilder('usuario')
      .innerJoin(
        'usuario_empresas',
        'ue',
        'ue.usuario_id = usuario.id AND ue.empresa_id = :empresaId',
        { empresaId },
      );

    if (query.search) {
      qb.andWhere(
        '(LOWER(usuario.nome) LIKE :search OR LOWER(usuario.email) LIKE :search)',
        {
          search: `%${query.search.toLowerCase()}%`,
        },
      );
    }

    if (query.departamentoId) {
      qb.andWhere('ue.departamento_id = :departamentoId', {
        departamentoId: query.departamentoId,
      });
    }

    if (query.ativo !== undefined) {
      qb.andWhere('usuario.ativo = :ativo', { ativo: query.ativo });
    }

    qb.orderBy('usuario.created_at', 'DESC').addOrderBy('usuario.id', 'DESC');

    qb.select('usuario.id', 'id')
      .addSelect('usuario.nome', 'nome')
      .addSelect('usuario.email', 'email')
      .addSelect('usuario.senha_hash', 'senha_hash')
      .addSelect('usuario.ativo', 'ativo')
      .addSelect('usuario.created_at', 'created_at')
      .addSelect('usuario.updated_at', 'updated_at')
      .addSelect('ue.empresa_id', 'empresa_id')
      .addSelect('ue.departamento_id', 'departamento_id');

    const rows = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getRawMany<UsuarioJoinedRow>();

    const countQb = this.ormRepo
      .createQueryBuilder('usuario')
      .innerJoin(
        'usuario_empresas',
        'ue',
        'ue.usuario_id = usuario.id AND ue.empresa_id = :empresaId',
        { empresaId },
      );

    if (query.search) {
      countQb.andWhere(
        '(LOWER(usuario.nome) LIKE :search OR LOWER(usuario.email) LIKE :search)',
        {
          search: `%${query.search.toLowerCase()}%`,
        },
      );
    }

    if (query.departamentoId) {
      countQb.andWhere('ue.departamento_id = :departamentoId', {
        departamentoId: query.departamentoId,
      });
    }

    if (query.ativo !== undefined) {
      countQb.andWhere('usuario.ativo = :ativo', { ativo: query.ativo });
    }

    const totalRows = await countQb.getCount();

    const items = rows.map((row) =>
      UsuarioMapper.toDomain({
        orm: {
          id: row.id,
          nome: row.nome,
          email: row.email,
          senha_hash: row.senha_hash,
          ativo: row.ativo === true || row.ativo === 1,
          created_at: new Date(row.created_at),
          updated_at: new Date(row.updated_at),
        } as UsuarioOrmEntity,
        empresaId: row.empresa_id,
        departamentoId: row.departamento_id,
      }),
    );

    return {
      items,
      page,
      pageSize: 10,
      total: totalRows,
      totalPages: Math.ceil(totalRows / pageSize),
    };
  }

  async save(usuario: Usuario): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();

    await this.dataSource.transaction(async (manager) => {
      const existingUser = await manager
        .createQueryBuilder(UsuarioOrmEntity, 'usuario')
        .where('usuario.id = :id', { id: usuario.id })
        .getOne();

      if (existingUser) {
        existingUser.nome = usuario.nome;
        existingUser.email = usuario.email;
        existingUser.senha_hash = usuario.senhaHash;
        existingUser.ativo = usuario.ativo;
        await manager.save(UsuarioOrmEntity, existingUser);
      } else {
        const orm = UsuarioMapper.toOrm(usuario);
        await manager.save(UsuarioOrmEntity, orm);
      }

      const membership = await manager.query(
        `
        SELECT usuario_id
        FROM usuario_empresas
        WHERE usuario_id = ? AND empresa_id = ?
        LIMIT 1
        `,
        [usuario.id, empresaId],
      );

      if ((membership as unknown[]).length === 0) {
        await manager.query(
          `
          INSERT INTO usuario_empresas (
            usuario_id,
            empresa_id,
            departamento_id,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
          `,
          [usuario.id, empresaId, usuario.departamentoId],
        );
      } else {
        await manager.query(
          `
          UPDATE usuario_empresas
          SET departamento_id = ?, updated_at = datetime('now')
          WHERE usuario_id = ? AND empresa_id = ?
          `,
          [usuario.departamentoId, usuario.id, empresaId],
        );
      }
    });
  }

  async delete(id: string): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `
        DELETE FROM usuario_empresas
        WHERE usuario_id = ? AND empresa_id = ?
        `,
        [id, empresaId],
      );

      const remainingMemberships = (await manager.query(
        `
        SELECT usuario_id
        FROM usuario_empresas
        WHERE usuario_id = ?
        LIMIT 1
        `,
        [id],
      )) as unknown[];

      if (remainingMemberships.length === 0) {
        await manager.delete(UsuarioOrmEntity, { id });
      }
    });
  }

  private async getMembershipByUsuarioId(
    empresaId: string,
    usuarioId: string,
  ): Promise<UsuarioMembershipRow | null> {
    const rows = (await this.dataSource.query(
      `
      SELECT usuario_id, empresa_id, departamento_id
      FROM usuario_empresas
      WHERE usuario_id = ? AND empresa_id = ?
      LIMIT 1
      `,
      [usuarioId, empresaId],
    )) as unknown as UsuarioMembershipRow[];

    return rows[0] ?? null;
  }
}
