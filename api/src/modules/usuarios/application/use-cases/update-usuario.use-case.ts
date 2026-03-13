import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Usuario } from '../../domain/entities/usuario.entity';
import {
  IUsuarioRepository,
  USUARIO_REPOSITORY,
} from '../../domain/repositories/usuario.repository.interface';

@Injectable()
export class UpdateUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(input: {
    id: string;
    nome?: string;
    email?: string;
    ativo?: boolean;
  }): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(input.id);

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    usuario.atualizarPerfil({
      nome: input.nome,
      email: input.email,
      ativo: input.ativo,
    });

    await this.usuarioRepository.save(usuario);

    return usuario;
  }
}
