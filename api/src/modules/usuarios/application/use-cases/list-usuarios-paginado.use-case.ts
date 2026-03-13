import { Inject, Injectable } from '@nestjs/common';
import {
  type IUsuarioRepository,
  type PaginatedUsuarios,
  USUARIO_REPOSITORY,
  type UsuarioListQuery,
} from '../../domain/repositories/usuario.repository.interface';

@Injectable()
export class ListUsuariosPaginadoUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(query: UsuarioListQuery): Promise<PaginatedUsuarios> {
    return this.usuarioRepository.listPaginated(query);
  }
}
