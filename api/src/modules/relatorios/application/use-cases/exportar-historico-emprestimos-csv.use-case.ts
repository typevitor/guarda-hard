import { Inject, Injectable } from '@nestjs/common';
import {
  ListarHistoricoEmprestimosUseCase,
  type RelatorioHistoricoLinha,
} from './listar-historico-emprestimos.use-case';
import type { RelatorioEmprestimosQueryDto } from '../dto/relatorio.schemas';

@Injectable()
export class ExportarHistoricoEmprestimosCsvUseCase {
  constructor(
    @Inject(ListarHistoricoEmprestimosUseCase)
    private readonly listarHistoricoEmprestimosUseCase: ListarHistoricoEmprestimosUseCase,
  ) {}

  async execute(input: RelatorioEmprestimosQueryDto): Promise<string> {
    const resultado =
      await this.listarHistoricoEmprestimosUseCase.execute(input);
    return this.toCsv(resultado.linhas);
  }

  private toCsv(linhas: RelatorioHistoricoLinha[]): string {
    const header =
      'emprestimoId,hardwareId,descricao,codigoPatrimonio,usuarioId,dataRetirada,dataDevolucao';

    const rows = linhas.map((linha) => {
      const values = [
        linha.emprestimoId,
        linha.hardwareId,
        linha.descricao,
        linha.codigoPatrimonio,
        linha.usuarioId,
        linha.dataRetirada,
        linha.dataDevolucao ?? '',
      ];

      return values.map((value) => this.escapeCsvValue(value)).join(',');
    });

    return [header, ...rows].join('\n');
  }

  private escapeCsvValue(value: string): string {
    const escaped = value.replaceAll('"', '""');
    return `"${escaped}"`;
  }
}
