import { Inject, Injectable } from '@nestjs/common';
import {
  DEPARTAMENTO_REPOSITORY,
  type DepartamentoListQuery,
  type IDepartamentoRepository,
  type PaginatedDepartamentos,
} from '../../domain/repositories/departamento.repository.interface';

@Injectable()
export class ListDepartamentosPaginadoUseCase {
  constructor(
    @Inject(DEPARTAMENTO_REPOSITORY)
    private readonly departamentoRepository: IDepartamentoRepository,
  ) {}

  async execute(query: DepartamentoListQuery): Promise<PaginatedDepartamentos> {
    return this.departamentoRepository.listPaginated(query);
  }
}
