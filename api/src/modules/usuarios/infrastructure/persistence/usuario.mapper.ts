import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioOrmEntity } from './usuario.orm-entity';

export class UsuarioMapper {
  static toDomain(orm: UsuarioOrmEntity): Usuario {
    return new Usuario({
      id: orm.id,
      empresaId: orm.empresa_id,
      departamentoId: orm.departamento_id,
      nome: orm.nome,
      email: orm.email,
      senhaHash: orm.senha_hash,
      ativo: orm.ativo,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: Usuario): UsuarioOrmEntity {
    const orm = new UsuarioOrmEntity();
    orm.id = domain.id;
    orm.empresa_id = domain.empresaId;
    orm.departamento_id = domain.departamentoId;
    orm.nome = domain.nome;
    orm.email = domain.email;
    orm.senha_hash = domain.senhaHash;
    orm.ativo = domain.ativo;
    return orm;
  }
}
