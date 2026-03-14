import { Inject, Injectable } from '@nestjs/common';
import { ListEmpresasUseCase } from '../use-cases/list-empresas.use-case';

@Injectable()
export class EmpresasService {
  constructor(
    @Inject(ListEmpresasUseCase)
    private readonly listEmpresasUseCase: ListEmpresasUseCase,
  ) {}

  async list(): Promise<Array<{ id: string; nome: string }>> {
    return this.listEmpresasUseCase.execute();
  }
}
