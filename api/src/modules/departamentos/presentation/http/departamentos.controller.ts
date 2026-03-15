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
import { DepartamentosService } from '../../application/services/departamentos.service';
import {
  createDepartamentoSchema,
  departamentoIdParamSchema,
  departamentoListQuerySchema,
  type DepartamentoListQueryDto,
  type CreateDepartamentoDto,
  updateDepartamentoSchema,
  type UpdateDepartamentoDto,
} from '../../application/dto/departamento.schemas';
import { ZodValidationPipe } from '../../../../shared/presentation/http/zod-validation.pipe';
import { Departamento } from '../../domain/entities/departamento.entity';
import { SessionPhaseGuard } from '../../../auth/presentation/http/session-phase.guard';

type DepartamentoOptionHttpResponse = {
  id: string;
  nome: string;
};

type DepartamentoHttpResponse = {
  id: string;
  empresaId: string;
  nome: string;
  createdAt: string;
  updatedAt: string;
};

type PaginatedDepartamentoHttpResponse = {
  items: DepartamentoHttpResponse[];
  page: number;
  pageSize: 10;
  total: number;
  totalPages: number;
};

@Controller('departamentos')
@UseGuards(SessionPhaseGuard)
export class DepartamentosController {
  constructor(
    @Inject(DepartamentosService)
    private readonly departamentosService: DepartamentosService,
  ) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createDepartamentoSchema))
    body: CreateDepartamentoDto,
  ): Promise<DepartamentoHttpResponse> {
    const created = await this.departamentosService.create(body);
    return this.toResponse(created);
  }

  @Get()
  async list(
    @Query(new ZodValidationPipe(departamentoListQuerySchema))
    query: DepartamentoListQueryDto,
  ): Promise<PaginatedDepartamentoHttpResponse> {
    const result = await this.departamentosService.listPaginated(query);

    return {
      items: result.items.map((row) => this.toResponse(row)),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    };
  }

  @Get('options')
  async listOptions(): Promise<DepartamentoOptionHttpResponse[]> {
    const options = await this.departamentosService.listOptions();
    return options.map((option) => ({ id: option.id, nome: option.nome }));
  }

  @Get(':id')
  async getById(
    @Param(new ZodValidationPipe(departamentoIdParamSchema))
    params: {
      id: string;
    },
  ): Promise<DepartamentoHttpResponse> {
    const found = await this.departamentosService.getById(params.id);
    return this.toResponse(found);
  }

  @Patch(':id')
  async update(
    @Param(new ZodValidationPipe(departamentoIdParamSchema))
    params: { id: string },
    @Body(new ZodValidationPipe(updateDepartamentoSchema))
    body: UpdateDepartamentoDto,
  ): Promise<DepartamentoHttpResponse> {
    const updated = await this.departamentosService.update(params.id, body);
    return this.toResponse(updated);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param(new ZodValidationPipe(departamentoIdParamSchema))
    params: {
      id: string;
    },
  ): Promise<void> {
    await this.departamentosService.delete(params.id);
  }

  private toResponse(entity: Departamento): DepartamentoHttpResponse {
    return {
      id: entity.id,
      empresaId: entity.empresaId,
      nome: entity.nome,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
