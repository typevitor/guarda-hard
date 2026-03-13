import { Inject, Injectable } from '@nestjs/common';
import {
  EMPRESTIMO_REPOSITORY,
  type EmprestimoListQuery,
  type IEmprestimoRepository,
  type PaginatedEmprestimos,
} from '../../domain/repositories/emprestimo.repository.interface';

@Injectable()
export class ListEmprestimosPaginadoUseCase {
  constructor(
    @Inject(EMPRESTIMO_REPOSITORY)
    private readonly emprestimoRepository: IEmprestimoRepository,
  ) {}

  async execute(query: EmprestimoListQuery): Promise<PaginatedEmprestimos> {
    return this.emprestimoRepository.listPaginated(query);
  }
}
