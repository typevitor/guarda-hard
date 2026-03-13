import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsuariosService } from '../../application/services/usuarios.service';
import {
  createUsuarioSchema,
  type CreateUsuarioDto,
  updateUsuarioSchema,
  type UpdateUsuarioDto,
  usuarioIdParamSchema,
} from '../../application/dto/usuario.schemas';
import { ZodValidationPipe } from '../../../../shared/presentation/http/zod-validation.pipe';
import { Usuario } from '../../domain/entities/usuario.entity';

type UsuarioHttpResponse = {
  id: string;
  empresaId: string;
  departamentoId: string;
  nome: string;
  email: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

@Controller('usuarios')
export class UsuariosController {
  constructor(
    @Inject(UsuariosService)
    private readonly usuariosService: UsuariosService,
  ) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createUsuarioSchema))
    body: CreateUsuarioDto,
  ): Promise<UsuarioHttpResponse> {
    const created = await this.usuariosService.create(body);
    return this.toResponse(created);
  }

  @Get()
  async list(): Promise<UsuarioHttpResponse[]> {
    const rows = await this.usuariosService.list();
    return rows.map((row) => this.toResponse(row));
  }

  @Get(':id')
  async getById(
    @Param(new ZodValidationPipe(usuarioIdParamSchema))
    params: {
      id: string;
    },
  ): Promise<UsuarioHttpResponse> {
    const found = await this.usuariosService.getById(params.id);
    return this.toResponse(found);
  }

  @Patch(':id')
  async update(
    @Param(new ZodValidationPipe(usuarioIdParamSchema))
    params: { id: string },
    @Body(new ZodValidationPipe(updateUsuarioSchema))
    body: UpdateUsuarioDto,
  ): Promise<UsuarioHttpResponse> {
    const updated = await this.usuariosService.update(params.id, body);
    return this.toResponse(updated);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param(new ZodValidationPipe(usuarioIdParamSchema))
    params: {
      id: string;
    },
  ): Promise<void> {
    await this.usuariosService.delete(params.id);
  }

  private toResponse(entity: Usuario): UsuarioHttpResponse {
    return {
      id: entity.id,
      empresaId: entity.empresaId,
      departamentoId: entity.departamentoId,
      nome: entity.nome,
      email: entity.email,
      ativo: entity.ativo,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
