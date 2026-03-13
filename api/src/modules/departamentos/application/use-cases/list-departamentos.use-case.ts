import { Inject, Injectable } from '@nestjs/common';
import {
  DEPARTAMENTO_REPOSITORY,
  IDepartamentoRepository,
} from '../../domain/repositories/departamento.repository.interface';
import { Departamento } from '../../domain/entities/departamento.entity';

@Injectable()
export class ListDepartamentosUseCase {
  constructor(
    @Inject(DEPARTAMENTO_REPOSITORY)
    private readonly departamentoRepository: IDepartamentoRepository,
  ) {}

  async execute(): Promise<Departamento[]> {
    return this.departamentoRepository.findAll();
  }
}
