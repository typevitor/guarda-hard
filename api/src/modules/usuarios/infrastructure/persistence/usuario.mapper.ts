import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioOrmEntity } from './usuario.orm-entity';

export class UsuarioMapper {
  static toDomain(input: {
    orm: UsuarioOrmEntity;
    empresaId: string;
    departamentoId: string;
  }): Usuario {
    return new Usuario({
      id: input.orm.id,
      empresaId: input.empresaId,
      departamentoId: input.departamentoId,
      nome: input.orm.nome,
      email: input.orm.email,
      senhaHash: input.orm.senha_hash,
      ativo: input.orm.ativo,
      createdAt: input.orm.created_at,
      updatedAt: input.orm.updated_at,
    });
  }

  static toOrm(domain: Usuario): UsuarioOrmEntity {
    const orm = new UsuarioOrmEntity();
    orm.id = domain.id;
    orm.nome = domain.nome;
    orm.email = domain.email;
    orm.senha_hash = domain.senhaHash;
    orm.ativo = domain.ativo;
    return orm;
  }
}
