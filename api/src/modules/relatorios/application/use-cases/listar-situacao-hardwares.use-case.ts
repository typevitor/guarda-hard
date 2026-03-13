import { Inject, Injectable } from '@nestjs/common';
import {
  HARDWARE_REPOSITORY,
  type IHardwareRepository,
} from '../../../hardwares/domain/repositories/hardware.repository.interface';
import {
  EMPRESTIMO_REPOSITORY,
  type IEmprestimoRepository,
} from '../../../emprestimos/domain/repositories/emprestimo.repository.interface';
import type { RelatorioStatusDto } from '../dto/relatorio.schemas';

export type RelatorioSituacaoLinha = {
  hardwareId: string;
  descricao: string;
  codigoPatrimonio: string;
  status: RelatorioStatusDto;
  usuarioId: string | null;
  dataRetirada: string | null;
  dataDevolucao: string | null;
};

export type RelatorioSituacaoResultado = {
  total: number;
  linhas: RelatorioSituacaoLinha[];
};

@Injectable()
export class ListarSituacaoHardwaresUseCase {
  constructor(
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
    @Inject(EMPRESTIMO_REPOSITORY)
    private readonly emprestimoRepository: IEmprestimoRepository,
  ) {}

  async execute(input: {
    status?: RelatorioStatusDto;
  }): Promise<RelatorioSituacaoResultado> {
    const hardwares = await this.hardwareRepository.findAll();
    const emprestimos = await this.emprestimoRepository.findAll();

    const emprestimoAtivoPorHardware = new Map<
      string,
      (typeof emprestimos)[number]
    >();

    for (const emprestimo of emprestimos) {
      if (emprestimo.dataDevolucao !== null) {
        continue;
      }

      const atual = emprestimoAtivoPorHardware.get(emprestimo.hardwareId);

      if (!atual || emprestimo.dataRetirada > atual.dataRetirada) {
        emprestimoAtivoPorHardware.set(emprestimo.hardwareId, emprestimo);
      }
    }

    const linhas = hardwares
      .map((hardware) => {
        const status = this.getStatus(hardware.funcionando, hardware.livre);
        const emprestimoAtivo =
          emprestimoAtivoPorHardware.get(hardware.id) ?? null;

        return {
          hardwareId: hardware.id,
          descricao: hardware.descricao,
          codigoPatrimonio: hardware.codigoPatrimonio,
          status,
          usuarioId: emprestimoAtivo?.usuarioId ?? null,
          dataRetirada: emprestimoAtivo
            ? this.normalizeDate(emprestimoAtivo.dataRetirada)
            : null,
          dataDevolucao: null,
        } satisfies RelatorioSituacaoLinha;
      })
      .filter((linha) => (input.status ? linha.status === input.status : true));

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
