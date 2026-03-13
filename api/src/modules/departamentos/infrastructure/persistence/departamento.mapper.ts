import { Departamento } from '../../domain/entities/departamento.entity';
import { DepartamentoOrmEntity } from './departamento.orm-entity';

export class DepartamentoMapper {
  static toDomain(orm: DepartamentoOrmEntity): Departamento {
    return new Departamento({
      id: orm.id,
      empresaId: orm.empresa_id,
      nome: orm.nome,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: Departamento): DepartamentoOrmEntity {
    const orm = new DepartamentoOrmEntity();
    orm.id = domain.id;
    orm.empresa_id = domain.empresaId;
    orm.nome = domain.nome;
    return orm;
  }
}
