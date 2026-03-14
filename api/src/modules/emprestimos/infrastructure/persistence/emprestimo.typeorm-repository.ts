// api/src/modules/emprestimos/infrastructure/persistence/emprestimo.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  type EmprestimoListQuery,
  IEmprestimoRepository,
  type PaginatedEmprestimos,
} from '../../domain/repositories/emprestimo.repository.interface';
import { Emprestimo } from '../../domain/entities/emprestimo.entity';
import { EmprestimoOrmEntity } from './emprestimo.orm-entity';
import { EmprestimoMapper } from './emprestimo.mapper';
import { TenantContext } from '../../../../tenant/application/tenant-context';

@Injectable()
export class TypeOrmEmprestimoRepository implements IEmprestimoRepository {
  constructor(
    @InjectRepository(EmprestimoOrmEntity)
    private readonly ormRepo: Repository<EmprestimoOrmEntity>,
    private readonly tenantContext: TenantContext,
  ) {}

  async findById(id: string): Promise<Emprestimo | null> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orm = await this.ormRepo.findOne({
      where: { id, empresa_id: empresaId },
    });
    return orm ? EmprestimoMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<Emprestimo[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orms = await this.ormRepo.find({ where: { empresa_id: empresaId } });
    return orms.map((orm) => EmprestimoMapper.toDomain(orm));
  }

  async listPaginated(
    query: EmprestimoListQuery,
  ): Promise<PaginatedEmprestimos> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const page = query.page;
    const pageSize = 10;

    const qb = this.ormRepo
      .createQueryBuilder('emprestimo')
      .leftJoinAndSelect('emprestimo.usuario', 'usuario')
      .leftJoinAndSelect('emprestimo.hardware', 'hardware')
      .where('emprestimo.empresa_id = :empresaId', { empresaId });

    if (query.search) {
      qb.andWhere(
        '(LOWER(usuario.nome) LIKE :search OR LOWER(hardware.descricao) LIKE :search OR LOWER(hardware.codigo_patrimonio) LIKE :search)',
        {
          search: `%${query.search.toLowerCase()}%`,
        },
      );
    }

    if (query.usuarioId) {
      qb.andWhere('emprestimo.usuario_id = :usuarioId', {
        usuarioId: query.usuarioId,
      });
    }

    if (query.hardwareId) {
      qb.andWhere('emprestimo.hardware_id = :hardwareId', {
        hardwareId: query.hardwareId,
      });
    }

    if (query.retiradaFrom) {
      qb.andWhere('emprestimo.data_retirada >= :retiradaFrom', {
        retiradaFrom: query.retiradaFrom,
      });
    }

    if (query.retiradaTo) {
      qb.andWhere('emprestimo.data_retirada <= :retiradaTo', {
        retiradaTo: query.retiradaTo,
      });
    }

    if (query.devolucaoFrom) {
      qb.andWhere('emprestimo.data_devolucao >= :devolucaoFrom', {
        devolucaoFrom: query.devolucaoFrom,
      });
    }

    if (query.devolucaoTo) {
      qb.andWhere('emprestimo.data_devolucao <= :devolucaoTo', {
        devolucaoTo: query.devolucaoTo,
      });
    }

    if (query.status === 'open') {
      qb.andWhere('emprestimo.data_devolucao IS NULL');
    }

    if (query.status === 'returned') {
      qb.andWhere('emprestimo.data_devolucao IS NOT NULL');
    }

    qb.orderBy('emprestimo.created_at', 'DESC').addOrderBy(
      'emprestimo.id',
      'DESC',
    );

    const [rows, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: rows.map((orm) => EmprestimoMapper.toDomain(orm)),
      page,
      pageSize: 10,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async save(emprestimo: Emprestimo): Promise<void> {
    const orm = EmprestimoMapper.toOrm(emprestimo);
    await this.ormRepo.save(orm);
  }

  async delete(id: string): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    await this.ormRepo.delete({ id, empresa_id: empresaId });
  }
}
