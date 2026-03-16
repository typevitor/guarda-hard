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
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from '../../application/services/usuarios.service';
import {
  createUsuarioSchema,
  type CreateUsuarioDto,
  type UsuarioListQueryDto,
  updateUsuarioSchema,
  type UpdateUsuarioDto,
  usuarioListQuerySchema,
  usuarioIdParamSchema,
} from '../../application/dto/usuario.schemas';
import { ZodValidationPipe } from '../../../../shared/presentation/http/zod-validation.pipe';
import { Usuario } from '../../domain/entities/usuario.entity';
import { SessionPhaseGuard } from '../../../auth/presentation/http/session-phase.guard';
import { UsuarioOption } from '../../domain/repositories/usuario.repository.interface';

type UsuarioHttpResponse = {
  id: string;
  empresaId: string;
  departamentoId: string | null;
  nome: string;
  email: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

type PaginatedUsuarioHttpResponse = {
  items: UsuarioHttpResponse[];
  page: number;
  pageSize: 10;
  total: number;
  totalPages: number;
};

type UsuarioOptionHttpResponse = {
  id: string;
  nome: string;
};

@Controller('usuarios')
@UseGuards(SessionPhaseGuard)
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
  async list(
    @Query(new ZodValidationPipe(usuarioListQuerySchema))
    query: UsuarioListQueryDto,
  ): Promise<PaginatedUsuarioHttpResponse> {
    const result = await this.usuariosService.listPaginated(query);

    return {
      items: result.items.map((row) => this.toResponse(row)),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    };
  }

  @Get('options')
  async listOptions(): Promise<UsuarioOptionHttpResponse[]> {
    const result = await this.usuariosService.listOptions();
    return result.map((row) => this.toOptionResponse(row));
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

  private toOptionResponse(entity: UsuarioOption): UsuarioOptionHttpResponse {
    return {
      id: entity.id,
      nome: entity.nome,
    };
  }
}
