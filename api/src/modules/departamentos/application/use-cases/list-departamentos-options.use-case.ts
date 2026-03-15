import { Inject, Injectable } from '@nestjs/common';
import {
  DEPARTAMENTO_REPOSITORY,
  type DepartamentoOption,
  type IDepartamentoRepository,
} from '../../domain/repositories/departamento.repository.interface';

@Injectable()
export class ListDepartamentosOptionsUseCase {
  constructor(
    @Inject(DEPARTAMENTO_REPOSITORY)
    private readonly departamentoRepository: IDepartamentoRepository,
  ) {}

  async execute(): Promise<DepartamentoOption[]> {
    return this.departamentoRepository.listOptions();
  }
}
