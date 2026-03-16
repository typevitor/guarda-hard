// api/src/modules/hardwares/infrastructure/persistence/hardware.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  type HardwareOption,
  type HardwareListQuery,
  IHardwareRepository,
  type PaginatedHardwares,
} from '../../domain/repositories/hardware.repository.interface';
import { Hardware } from '../../domain/entities/hardware.entity';
import { HardwareOrmEntity } from './hardware.orm-entity';
import { HardwareMapper } from './hardware.mapper';
import { TenantContext } from '../../../../tenant/application/tenant-context';

@Injectable()
export class TypeOrmHardwareRepository implements IHardwareRepository {
  constructor(
    @InjectRepository(HardwareOrmEntity)
    private readonly ormRepo: Repository<HardwareOrmEntity>,
    private readonly tenantContext: TenantContext,
  ) {}

  async findById(id: string): Promise<Hardware | null> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orm = await this.ormRepo.findOne({
      where: { id, empresa_id: empresaId },
    });
    return orm ? HardwareMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<Hardware[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orms = await this.ormRepo.find({
      where: { empresa_id: empresaId },
    });
    return orms.map((orm) => HardwareMapper.toDomain(orm));
  }

  async listPaginated(query: HardwareListQuery): Promise<PaginatedHardwares> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const page = query.page;
    const pageSize = 10;

    const qb = this.ormRepo
      .createQueryBuilder('hardware')
      .where('hardware.empresa_id = :empresaId', { empresaId });

    if (query.search) {
      qb.andWhere(
        '(LOWER(hardware.descricao) LIKE :search OR LOWER(hardware.marca) LIKE :search OR LOWER(hardware.modelo) LIKE :search OR LOWER(hardware.codigo_patrimonio) LIKE :search)',
        {
          search: `%${query.search.toLowerCase()}%`,
        },
      );
    }

    if (query.funcionando !== undefined) {
      qb.andWhere('hardware.funcionando = :funcionando', {
        funcionando: query.funcionando,
      });
    }

    if (query.livre !== undefined) {
      qb.andWhere('hardware.livre = :livre', { livre: query.livre });
    }

    qb.orderBy('hardware.created_at', 'DESC').addOrderBy('hardware.id', 'DESC');

    const [rows, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: rows.map((orm) => HardwareMapper.toDomain(orm)),
      page,
      pageSize: 10,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async listOptions(): Promise<HardwareOption[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const rows = await this.ormRepo
      .createQueryBuilder('hardware')
      .select('hardware.id', 'id')
      .addSelect('hardware.descricao', 'descricao')
      .addSelect('hardware.marca', 'marca')
      .addSelect('hardware.modelo', 'modelo')
      .addSelect('hardware.codigo_patrimonio', 'codigoPatrimonio')
      .where('hardware.empresa_id = :empresaId', { empresaId })
      .andWhere('hardware.livre = :livre', { livre: true })
      .andWhere('hardware.funcionando = :funcionando', { funcionando: true })
      .orderBy('LOWER(hardware.descricao)', 'ASC')
      .addOrderBy('LOWER(hardware.marca)', 'ASC')
      .addOrderBy('LOWER(hardware.modelo)', 'ASC')
      .addOrderBy('hardware.id', 'ASC')
      .getRawMany<HardwareOption>();

    return rows;
  }

  async save(hardware: Hardware): Promise<void> {
    const orm = HardwareMapper.toOrm(hardware);
    await this.ormRepo.save(orm);
  }

  async delete(id: string): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    await this.ormRepo.delete({ id, empresa_id: empresaId });
  }
}
