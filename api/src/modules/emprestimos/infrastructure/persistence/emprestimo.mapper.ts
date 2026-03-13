import { Emprestimo } from '../../domain/entities/emprestimo.entity';
import { EmprestimoOrmEntity } from './emprestimo.orm-entity';

export class EmprestimoMapper {
  static toDomain(orm: EmprestimoOrmEntity): Emprestimo {
    return new Emprestimo({
      id: orm.id,
      empresaId: orm.empresa_id,
      usuarioId: orm.usuario_id,
      hardwareId: orm.hardware_id,
      dataRetirada: orm.data_retirada,
      dataDevolucao: orm.data_devolucao,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: Emprestimo): EmprestimoOrmEntity {
    const orm = new EmprestimoOrmEntity();
    orm.id = domain.id;
    orm.empresa_id = domain.empresaId;
    orm.usuario_id = domain.usuarioId;
    orm.hardware_id = domain.hardwareId;
    orm.data_retirada = domain.dataRetirada;
    orm.data_devolucao = domain.dataDevolucao;
    return orm;
  }
}
