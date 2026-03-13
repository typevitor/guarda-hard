// api/src/modules/emprestimos/infrastructure/persistence/emprestimo.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEmprestimoRepository } from '../../domain/repositories/emprestimo.repository.interface';
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
    return orms.map(EmprestimoMapper.toDomain);
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
