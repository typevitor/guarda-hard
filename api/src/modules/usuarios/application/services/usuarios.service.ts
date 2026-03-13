import { Inject, Injectable } from '@nestjs/common';
import { TenantContext } from '../../../../tenant/application/tenant-context';
import { Usuario } from '../../domain/entities/usuario.entity';
import type {
  CreateUsuarioDto,
  UpdateUsuarioDto,
} from '../dto/usuario.schemas';
import { CreateUsuarioUseCase } from '../use-cases/create-usuario.use-case';
import { ListUsuariosUseCase } from '../use-cases/list-usuarios.use-case';
import { GetUsuarioByIdUseCase } from '../use-cases/get-usuario-by-id.use-case';
import { UpdateUsuarioUseCase } from '../use-cases/update-usuario.use-case';
import { DeleteUsuarioUseCase } from '../use-cases/delete-usuario.use-case';

@Injectable()
export class UsuariosService {
  constructor(
    @Inject(TenantContext)
    private readonly tenantContext: TenantContext,
    @Inject(CreateUsuarioUseCase)
    private readonly createUsuarioUseCase: CreateUsuarioUseCase,
    @Inject(ListUsuariosUseCase)
    private readonly listUsuariosUseCase: ListUsuariosUseCase,
    @Inject(GetUsuarioByIdUseCase)
    private readonly getUsuarioByIdUseCase: GetUsuarioByIdUseCase,
    @Inject(UpdateUsuarioUseCase)
    private readonly updateUsuarioUseCase: UpdateUsuarioUseCase,
    @Inject(DeleteUsuarioUseCase)
    private readonly deleteUsuarioUseCase: DeleteUsuarioUseCase,
  ) {}

  async create(input: CreateUsuarioDto): Promise<Usuario> {
    const empresaId = this.tenantContext.requireEmpresaId();

    return this.createUsuarioUseCase.execute({
      empresaId,
      departamentoId: input.departamentoId,
      nome: input.nome,
      email: input.email,
    });
  }

  async list(): Promise<Usuario[]> {
    return this.listUsuariosUseCase.execute();
  }

  async getById(id: string): Promise<Usuario> {
    return this.getUsuarioByIdUseCase.execute(id);
  }

  async update(id: string, input: UpdateUsuarioDto): Promise<Usuario> {
    return this.updateUsuarioUseCase.execute({
      id,
      nome: input.nome,
      email: input.email,
      ativo: input.ativo,
    });
  }

  async delete(id: string): Promise<void> {
    await this.deleteUsuarioUseCase.execute(id);
  }
}
