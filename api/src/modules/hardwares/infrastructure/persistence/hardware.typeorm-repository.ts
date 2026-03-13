// api/src/modules/hardwares/infrastructure/persistence/hardware.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IHardwareRepository } from '../../domain/repositories/hardware.repository.interface';
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

  async save(hardware: Hardware): Promise<void> {
    const orm = HardwareMapper.toOrm(hardware);
    await this.ormRepo.save(orm);
  }

  async delete(id: string): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    await this.ormRepo.delete({ id, empresa_id: empresaId });
  }
}
