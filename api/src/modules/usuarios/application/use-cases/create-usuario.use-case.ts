import { Inject, Injectable } from '@nestjs/common';
import { Usuario } from '../../domain/entities/usuario.entity';
import {
  IUsuarioRepository,
  USUARIO_REPOSITORY,
} from '../../domain/repositories/usuario.repository.interface';

@Injectable()
export class CreateUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(input: {
    empresaId: string;
    departamentoId: string;
    nome: string;
    email: string;
  }): Promise<Usuario> {
    const usuario = Usuario.create({
      empresaId: input.empresaId,
      departamentoId: input.departamentoId,
      nome: input.nome,
      email: input.email,
    });

    await this.usuarioRepository.save(usuario);

    return usuario;
  }
}
