// api/src/modules/usuarios/domain/repositories/usuario.repository.interface.ts
import { Usuario } from '../entities/usuario.entity';

export interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  save(usuario: Usuario): Promise<void>;
  delete(id: string): Promise<void>;
}

export const USUARIO_REPOSITORY = Symbol('IUsuarioRepository');
