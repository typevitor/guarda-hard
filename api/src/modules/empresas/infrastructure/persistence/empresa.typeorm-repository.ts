import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '../../domain/entities/empresa.entity';
import { IEmpresaRepository } from '../../domain/repositories/empresa.repository.interface';
import { EmpresaOrmEntity } from './empresa.orm-entity';

@Injectable()
export class TypeOrmEmpresaRepository implements IEmpresaRepository {
  constructor(
    @InjectRepository(EmpresaOrmEntity)
    private readonly ormRepo: Repository<EmpresaOrmEntity>,
  ) {}

  async findAll(): Promise<Empresa[]> {
    const rows = await this.ormRepo.find({
      order: { nome: 'ASC' },
    });

    return rows.map((row) => new Empresa({ id: row.id, nome: row.nome }));
  }
}
