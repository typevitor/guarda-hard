// api/src/modules/departamentos/infrastructure/persistence/departamento.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  type DepartamentoListQuery,
  IDepartamentoRepository,
  type PaginatedDepartamentos,
} from '../../domain/repositories/departamento.repository.interface';
import { Departamento } from '../../domain/entities/departamento.entity';
import { DepartamentoOrmEntity } from './departamento.orm-entity';
import { DepartamentoMapper } from './departamento.mapper';
import { TenantContext } from '../../../../tenant/application/tenant-context';

@Injectable()
export class TypeOrmDepartamentoRepository implements IDepartamentoRepository {
  constructor(
    @InjectRepository(DepartamentoOrmEntity)
    private readonly ormRepo: Repository<DepartamentoOrmEntity>,
    private readonly tenantContext: TenantContext,
  ) {}

  async findById(id: string): Promise<Departamento | null> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orm = await this.ormRepo.findOne({
      where: { id, empresa_id: empresaId },
    });
    return orm ? DepartamentoMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<Departamento[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orms = await this.ormRepo.find({ where: { empresa_id: empresaId } });
    return orms.map((orm) => DepartamentoMapper.toDomain(orm));
  }

  async listPaginated(
    query: DepartamentoListQuery,
  ): Promise<PaginatedDepartamentos> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const page = query.page;
    const pageSize = 10;

    const qb = this.ormRepo
      .createQueryBuilder('departamento')
      .where('departamento.empresa_id = :empresaId', { empresaId });

    if (query.search) {
      qb.andWhere('LOWER(departamento.nome) LIKE :search', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }

    qb.orderBy('departamento.created_at', 'DESC').addOrderBy(
      'departamento.id',
      'DESC',
    );

    const [rows, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: rows.map((orm) => DepartamentoMapper.toDomain(orm)),
      page,
      pageSize: 10,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async save(departamento: Departamento): Promise<void> {
    const orm = DepartamentoMapper.toOrm(departamento);
    await this.ormRepo.save(orm);
  }

  async delete(id: string): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    await this.ormRepo.delete({ id, empresa_id: empresaId });
  }
}
