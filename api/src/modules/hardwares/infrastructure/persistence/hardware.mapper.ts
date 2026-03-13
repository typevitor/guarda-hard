import { Hardware } from '../../domain/entities/hardware.entity';
import { HardwareOrmEntity } from './hardware.orm-entity';

export class HardwareMapper {
  static toDomain(orm: HardwareOrmEntity): Hardware {
    return new Hardware({
      id: orm.id,
      empresaId: orm.empresa_id,
      descricao: orm.descricao,
      marca: orm.marca,
      modelo: orm.modelo,
      codigoPatrimonio: orm.codigo_patrimonio,
      funcionando: orm.funcionando,
      descricaoProblema: orm.descricao_problema,
      livre: orm.livre,
      version: orm.version,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: Hardware): HardwareOrmEntity {
    const orm = new HardwareOrmEntity();
    orm.id = domain.id;
    orm.empresa_id = domain.empresaId;
    orm.descricao = domain.descricao;
    orm.marca = domain.marca;
    orm.modelo = domain.modelo;
    orm.codigo_patrimonio = domain.codigoPatrimonio;
    orm.funcionando = domain.funcionando;
    orm.descricao_problema = domain.descricaoProblema;
    orm.livre = domain.livre;
    orm.version = domain.version;
    // created_at and updated_at are NOT set in toOrm().
    // TypeORM's @CreateDateColumn and @UpdateDateColumn manage these automatically.
    return orm;
  }
}
