import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
import { EmprestimosService } from '../../application/services/emprestimos.service';
import {
  createEmprestimoSchema,
  emprestimoIdParamSchema,
  type CreateEmprestimoDto,
} from '../../application/dto/emprestimo.schemas';
import { ZodValidationPipe } from '../../../../shared/presentation/http/zod-validation.pipe';
import { Emprestimo } from '../../domain/entities/emprestimo.entity';

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

@Controller('emprestimos')
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
