import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IUsuarioRepository,
  USUARIO_REPOSITORY,
} from '../../domain/repositories/usuario.repository.interface';

@Injectable()
export class DeleteUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const usuario = await this.usuarioRepository.findById(id);

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await this.usuarioRepository.delete(id);
  }
}
