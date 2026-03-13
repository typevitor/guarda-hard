import { Inject, Injectable } from '@nestjs/common';
import {
  EMPRESTIMO_REPOSITORY,
  type IEmprestimoRepository,
} from '../../../emprestimos/domain/repositories/emprestimo.repository.interface';
import {
  HARDWARE_REPOSITORY,
  type IHardwareRepository,
} from '../../../hardwares/domain/repositories/hardware.repository.interface';
import type {
  RelatorioEmprestimosQueryDto,
  RelatorioStatusDto,
} from '../dto/relatorio.schemas';

export type RelatorioHistoricoLinha = {
  emprestimoId: string;
  hardwareId: string;
  descricao: string;
  codigoPatrimonio: string;
  status: RelatorioStatusDto;
  usuarioId: string;
  dataRetirada: string;
  dataDevolucao: string | null;
};

export type RelatorioHistoricoResultado = {
  total: number;
  linhas: RelatorioHistoricoLinha[];
};

@Injectable()
export class ListarHistoricoEmprestimosUseCase {
  constructor(
    @Inject(EMPRESTIMO_REPOSITORY)
    private readonly emprestimoRepository: IEmprestimoRepository,
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(
    input: RelatorioEmprestimosQueryDto,
  ): Promise<RelatorioHistoricoResultado> {
    const [emprestimos, hardwares] = await Promise.all([
      this.emprestimoRepository.findAll(),
      this.hardwareRepository.findAll(),
    ]);

    const hardwaresPorId = new Map(
      hardwares.map((hardware) => [hardware.id, hardware]),
    );

    const linhas = emprestimos
      .map((emprestimo) => {
        const hardware = hardwaresPorId.get(emprestimo.hardwareId);

        if (!hardware) {
          return null;
        }

        const status = this.getStatus(hardware.funcionando, hardware.livre);

        return {
          emprestimoId: emprestimo.id,
          hardwareId: hardware.id,
          descricao: hardware.descricao,
          codigoPatrimonio: hardware.codigoPatrimonio,
          status,
          usuarioId: emprestimo.usuarioId,
          dataRetirada: this.normalizeDate(emprestimo.dataRetirada),
          dataDevolucao: emprestimo.dataDevolucao
            ? this.normalizeDate(emprestimo.dataDevolucao)
            : null,
        } satisfies RelatorioHistoricoLinha;
      })
      .filter((linha): linha is RelatorioHistoricoLinha => linha !== null)
      .filter((linha) => {
        if (input.status && linha.status !== input.status) {
          return false;
        }

        if (
          input.usuario &&
          !linha.usuarioId.toLowerCase().includes(input.usuario.toLowerCase())
        ) {
          return false;
        }

        if (input.hardware) {
          const term = input.hardware.toLowerCase();
          if (
            !linha.hardwareId.toLowerCase().includes(term) &&
            !linha.descricao.toLowerCase().includes(term) &&
            !linha.codigoPatrimonio.toLowerCase().includes(term)
          ) {
            return false;
          }
        }

        if (input.periodoInicio && linha.dataRetirada < input.periodoInicio) {
          return false;
        }

        if (input.periodoFim && linha.dataRetirada > input.periodoFim) {
          return false;
        }

        return true;
      });

    return {
      total: linhas.length,
      linhas,
    };
  }

  private getStatus(funcionando: boolean, livre: boolean): RelatorioStatusDto {
    if (!funcionando) {
      return 'defeituoso';
    }

    if (livre) {
      return 'disponivel';
    }

    return 'emprestado';
  }

  private normalizeDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
