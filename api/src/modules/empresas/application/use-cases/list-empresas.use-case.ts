import { Inject, Injectable } from '@nestjs/common';
import {
  EMPRESA_REPOSITORY,
  IEmpresaRepository,
} from '../../domain/repositories/empresa.repository.interface';

@Injectable()
export class ListEmpresasUseCase {
  constructor(
    @Inject(EMPRESA_REPOSITORY)
    private readonly empresaRepository: IEmpresaRepository,
  ) {}

  async execute(): Promise<Array<{ id: string; nome: string }>> {
    const empresas = await this.empresaRepository.findAll();

    return empresas
      .map((empresa) => ({ id: empresa.id, nome: empresa.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }
}
