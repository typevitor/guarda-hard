import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DEPARTAMENTO_REPOSITORY,
  IDepartamentoRepository,
} from '../../domain/repositories/departamento.repository.interface';

@Injectable()
export class DeleteDepartamentoUseCase {
  constructor(
    @Inject(DEPARTAMENTO_REPOSITORY)
    private readonly departamentoRepository: IDepartamentoRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const departamento = await this.departamentoRepository.findById(id);

    if (!departamento) {
      throw new NotFoundException('Departamento nao encontrado');
    }

    await this.departamentoRepository.delete(id);
  }
}
