import { Controller, Get, Header, Inject, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ZodValidationPipe } from '../../../../shared/presentation/http/zod-validation.pipe';
import {
  relatorioEmprestimosQuerySchema,
  relatorioHardwaresQuerySchema,
  type RelatorioEmprestimosQueryDto,
  type RelatorioHardwaresQueryDto,
} from '../../application/dto/relatorio.schemas';
import { RelatoriosService } from '../../application/services/relatorios.service';

@Controller('relatorios')
export class RelatoriosController {
  constructor(
    @Inject(RelatoriosService)
    private readonly relatoriosService: RelatoriosService,
  ) {}

  @Get('hardwares')
  async listarSituacaoHardwares(
    @Query(new ZodValidationPipe(relatorioHardwaresQuerySchema))
    query: RelatorioHardwaresQueryDto,
  ) {
    return this.relatoriosService.listarSituacaoHardwares(query);
  }

  @Get('emprestimos')
  async listarHistoricoEmprestimos(
    @Query(new ZodValidationPipe(relatorioEmprestimosQuerySchema))
    query: RelatorioEmprestimosQueryDto,
  ) {
    return this.relatoriosService.listarHistoricoEmprestimos(query);
  }

  @Get('emprestimos/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportarHistoricoEmprestimosCsv(
    @Query(new ZodValidationPipe(relatorioEmprestimosQuerySchema))
    query: RelatorioEmprestimosQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="relatorio-emprestimos.csv"',
    );

    return this.relatoriosService.exportarHistoricoEmprestimosCsv(query);
  }
}
