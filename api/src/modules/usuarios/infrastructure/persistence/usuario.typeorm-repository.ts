// api/src/modules/usuarios/infrastructure/persistence/usuario.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IUsuarioRepository,
  type PaginatedUsuarios,
  type UsuarioListQuery,
} from '../../domain/repositories/usuario.repository.interface';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioOrmEntity } from './usuario.orm-entity';
import { UsuarioMapper } from './usuario.mapper';
import { TenantContext } from '../../../../tenant/application/tenant-context';

@Injectable()
export class TypeOrmUsuarioRepository implements IUsuarioRepository {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly ormRepo: Repository<UsuarioOrmEntity>,
    private readonly tenantContext: TenantContext,
  ) {}

  async findById(id: string): Promise<Usuario | null> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orm = await this.ormRepo.findOne({
      where: { id, empresa_id: empresaId },
    });
    return orm ? UsuarioMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<Usuario[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orms = await this.ormRepo.find({ where: { empresa_id: empresaId } });
    return orms.map((orm) => UsuarioMapper.toDomain(orm));
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const orm = await this.ormRepo.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    return orm ? UsuarioMapper.toDomain(orm) : null;
  }

  async listPaginated(query: UsuarioListQuery): Promise<PaginatedUsuarios> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const page = query.page;
    const pageSize = 10;

    const qb = this.ormRepo
      .createQueryBuilder('usuario')
      .where('usuario.empresa_id = :empresaId', { empresaId });

    if (query.search) {
      qb.andWhere(
        '(LOWER(usuario.nome) LIKE :search OR LOWER(usuario.email) LIKE :search)',
        {
          search: `%${query.search.toLowerCase()}%`,
        },
      );
    }

    if (query.departamentoId) {
      qb.andWhere('usuario.departamento_id = :departamentoId', {
        departamentoId: query.departamentoId,
      });
    }

    if (query.ativo !== undefined) {
      qb.andWhere('usuario.ativo = :ativo', { ativo: query.ativo });
    }

    qb.orderBy('usuario.created_at', 'DESC').addOrderBy('usuario.id', 'DESC');

    const [rows, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: rows.map((orm) => UsuarioMapper.toDomain(orm)),
      page,
      pageSize: 10,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async save(usuario: Usuario): Promise<void> {
    const orm = UsuarioMapper.toOrm(usuario);
    await this.ormRepo.save(orm);
  }

  async delete(id: string): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    await this.ormRepo.delete({ id, empresa_id: empresaId });
  }
}
