import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DEPARTAMENTO_REPOSITORY,
  IDepartamentoRepository,
} from '../../domain/repositories/departamento.repository.interface';
import { Departamento } from '../../domain/entities/departamento.entity';

@Injectable()
export class GetDepartamentoByIdUseCase {
  constructor(
    @Inject(DEPARTAMENTO_REPOSITORY)
    private readonly departamentoRepository: IDepartamentoRepository,
  ) {}

  async execute(id: string): Promise<Departamento> {
    const departamento = await this.departamentoRepository.findById(id);

    if (!departamento) {
      throw new NotFoundException('Departamento nao encontrado');
    }

    return departamento;
  }
}
