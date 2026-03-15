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
    empresaId: string;
    departamentoId?: string | null;
    nome?: string;
    email?: string;
    senhaHash?: string;
    ativo?: boolean;
  }): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(input.id);

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const departamentoId =
      input.departamentoId === undefined
        ? usuario.departamentoId
        : input.departamentoId;

    const atualizado = new Usuario({
      id: usuario.id,
      empresaId: input.empresaId,
      departamentoId,
      nome: input.nome ?? usuario.nome,
      email: input.email ?? usuario.email,
      senhaHash: input.senhaHash ?? usuario.senhaHash,
      ativo: input.ativo ?? usuario.ativo,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    });

    atualizado.atualizarPerfil({
      nome: input.nome,
      email: input.email,
      senhaHash: input.senhaHash,
      ativo: input.ativo,
    });

    await this.usuarioRepository.save(atualizado);

    return atualizado;
  }
}
