import { Inject, Injectable } from '@nestjs/common';
import {
  type IUsuarioRepository,
  type UsuarioOption,
  USUARIO_REPOSITORY,
} from '../../domain/repositories/usuario.repository.interface';

@Injectable()
export class ListUsuariosOptionsUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(): Promise<UsuarioOption[]> {
    return this.usuarioRepository.listOptions();
  }
}
