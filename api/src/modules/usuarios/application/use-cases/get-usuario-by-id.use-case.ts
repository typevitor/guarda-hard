import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Usuario } from '../../domain/entities/usuario.entity';
import {
  IUsuarioRepository,
  USUARIO_REPOSITORY,
} from '../../domain/repositories/usuario.repository.interface';

@Injectable()
export class GetUsuarioByIdUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(id);

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return usuario;
  }
}
