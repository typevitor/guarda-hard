import { Inject, Injectable } from '@nestjs/common';
import { ListarSituacaoHardwaresUseCase } from '../use-cases/listar-situacao-hardwares.use-case';
import { ListarHistoricoEmprestimosUseCase } from '../use-cases/listar-historico-emprestimos.use-case';
import { ExportarHistoricoEmprestimosCsvUseCase } from '../use-cases/exportar-historico-emprestimos-csv.use-case';
import type {
  RelatorioEmprestimosQueryDto,
  RelatorioHardwaresQueryDto,
} from '../dto/relatorio.schemas';

@Injectable()
export class RelatoriosService {
  constructor(
    @Inject(ListarSituacaoHardwaresUseCase)
    private readonly listarSituacaoHardwaresUseCase: ListarSituacaoHardwaresUseCase,
    @Inject(ListarHistoricoEmprestimosUseCase)
    private readonly listarHistoricoEmprestimosUseCase: ListarHistoricoEmprestimosUseCase,
    @Inject(ExportarHistoricoEmprestimosCsvUseCase)
    private readonly exportarHistoricoEmprestimosCsvUseCase: ExportarHistoricoEmprestimosCsvUseCase,
  ) {}

  async listarSituacaoHardwares(query: RelatorioHardwaresQueryDto) {
    return this.listarSituacaoHardwaresUseCase.execute({
      status: query.status,
    });
  }

  async listarHistoricoEmprestimos(query: RelatorioEmprestimosQueryDto) {
    return this.listarHistoricoEmprestimosUseCase.execute(query);
  }

  async exportarHistoricoEmprestimosCsv(query: RelatorioEmprestimosQueryDto) {
    return this.exportarHistoricoEmprestimosCsvUseCase.execute(query);
  }
}
