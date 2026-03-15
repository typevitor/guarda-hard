import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmprestimosService } from '../../application/services/emprestimos.service';
import {
  createEmprestimoSchema,
  emprestimoIdParamSchema,
  type CreateEmprestimoDto,
  emprestimoListQuerySchema,
  type EmprestimoListQueryDto,
} from '../../application/dto/emprestimo.schemas';
import { ZodValidationPipe } from '../../../../shared/presentation/http/zod-validation.pipe';
import { Emprestimo } from '../../domain/entities/emprestimo.entity';
import { SessionPhaseGuard } from '../../../auth/presentation/http/session-phase.guard';

type EmprestimoHttpResponse = {
  id: string;
  empresaId: string;
  usuarioId: string;
  hardwareId: string;
  dataRetirada: string;
  dataDevolucao: string | null;
  createdAt: string;
  updatedAt: string;
};

type PaginatedEmprestimoHttpResponse = {
  items: EmprestimoHttpResponse[];
  page: number;
  pageSize: 10;
  total: number;
  totalPages: number;
};

@Controller('emprestimos')
@UseGuards(SessionPhaseGuard)
export class EmprestimosController {
  constructor(
    @Inject(EmprestimosService)
    private readonly emprestimosService: EmprestimosService,
  ) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createEmprestimoSchema))
    body: CreateEmprestimoDto,
  ): Promise<EmprestimoHttpResponse> {
    const created = await this.emprestimosService.emprestar(body);
    return this.toResponse(created);
  }

  @Post(':id/devolucao')
  async devolver(
    @Param(new ZodValidationPipe(emprestimoIdParamSchema))
    params: {
      id: string;
    },
  ): Promise<EmprestimoHttpResponse> {
    const updated = await this.emprestimosService.devolver(params.id);
    return this.toResponse(updated);
  }

  @Get()
  async list(
    @Query(new ZodValidationPipe(emprestimoListQuerySchema))
    query: EmprestimoListQueryDto,
  ): Promise<PaginatedEmprestimoHttpResponse> {
    const result = await this.emprestimosService.listPaginated(query);

    return {
      items: result.items.map((row) => this.toResponse(row)),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    };
  }

  private toResponse(entity: Emprestimo): EmprestimoHttpResponse {
    return {
      id: entity.id,
      empresaId: entity.empresaId,
      usuarioId: entity.usuarioId,
      hardwareId: entity.hardwareId,
      dataRetirada: entity.dataRetirada.toISOString(),
      dataDevolucao: entity.dataDevolucao?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
