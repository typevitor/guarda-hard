// api/src/modules/usuarios/domain/repositories/usuario.repository.interface.ts
import { Usuario } from '../entities/usuario.entity';

export type UsuarioListQuery = {
  page: number;
  pageSize: 10;
  search?: string;
  departamentoId?: string;
  ativo?: boolean;
};

export type PaginatedUsuarios = {
  items: Usuario[];
  page: number;
  pageSize: 10;
  total: number;
  totalPages: number;
};

export interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  listPaginated(query: UsuarioListQuery): Promise<PaginatedUsuarios>;
  save(usuario: Usuario): Promise<void>;
  delete(id: string): Promise<void>;
}

export const USUARIO_REPOSITORY = Symbol('IUsuarioRepository');
