import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DEPARTAMENTO_REPOSITORY,
  IDepartamentoRepository,
} from '../../domain/repositories/departamento.repository.interface';
import { Departamento } from '../../domain/entities/departamento.entity';

@Injectable()
export class UpdateDepartamentoUseCase {
  constructor(
    @Inject(DEPARTAMENTO_REPOSITORY)
    private readonly departamentoRepository: IDepartamentoRepository,
  ) {}

  async execute(input: { id: string; nome?: string }): Promise<Departamento> {
    const departamento = await this.departamentoRepository.findById(input.id);

    if (!departamento) {
      throw new NotFoundException('Departamento nao encontrado');
    }

    if (input.nome !== undefined) {
      departamento.renomear(input.nome);
    }

    await this.departamentoRepository.save(departamento);

    return departamento;
  }
}
