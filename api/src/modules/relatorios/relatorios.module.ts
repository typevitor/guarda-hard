import { Module } from '@nestjs/common';
import { HardwaresModule } from '../hardwares/hardwares.module';
import { EmprestimosModule } from '../emprestimos/emprestimos.module';
import { RelatoriosController } from './presentation/http/relatorios.controller';
import { RelatoriosService } from './application/services/relatorios.service';
import { ListarSituacaoHardwaresUseCase } from './application/use-cases/listar-situacao-hardwares.use-case';
import { ListarHistoricoEmprestimosUseCase } from './application/use-cases/listar-historico-emprestimos.use-case';
import { ExportarHistoricoEmprestimosCsvUseCase } from './application/use-cases/exportar-historico-emprestimos-csv.use-case';

@Module({
  imports: [HardwaresModule, EmprestimosModule],
  controllers: [RelatoriosController],
  providers: [
    RelatoriosService,
    ListarSituacaoHardwaresUseCase,
    ListarHistoricoEmprestimosUseCase,
    ExportarHistoricoEmprestimosCsvUseCase,
  ],
})
export class RelatoriosModule {}
