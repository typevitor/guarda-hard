import { Inject, Injectable } from '@nestjs/common';
import {
  DEPARTAMENTO_REPOSITORY,
  IDepartamentoRepository,
} from '../../domain/repositories/departamento.repository.interface';
import { Departamento } from '../../domain/entities/departamento.entity';

@Injectable()
export class CreateDepartamentoUseCase {
  constructor(
    @Inject(DEPARTAMENTO_REPOSITORY)
    private readonly departamentoRepository: IDepartamentoRepository,
  ) {}

  async execute(input: {
    empresaId: string;
    nome: string;
  }): Promise<Departamento> {
    const departamento = Departamento.create({
      empresaId: input.empresaId,
      nome: input.nome,
    });

    await this.departamentoRepository.save(departamento);

    return departamento;
  }
}
