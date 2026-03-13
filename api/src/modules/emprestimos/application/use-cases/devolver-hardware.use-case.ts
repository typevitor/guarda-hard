import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EMPRESTIMO_REPOSITORY,
  IEmprestimoRepository,
} from '../../domain/repositories/emprestimo.repository.interface';
import {
  HARDWARE_REPOSITORY,
  IHardwareRepository,
} from '../../../hardwares/domain/repositories/hardware.repository.interface';
import { Emprestimo } from '../../domain/entities/emprestimo.entity';
import { EmprestimoJaDevolvidoError } from '../../domain/errors/emprestimo-ja-devolvido.error';

@Injectable()
export class DevolverHardwareUseCase {
  constructor(
    @Inject(EMPRESTIMO_REPOSITORY)
    private readonly emprestimoRepository: IEmprestimoRepository,
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(input: { id: string }): Promise<Emprestimo> {
    const emprestimo = await this.emprestimoRepository.findById(input.id);

    if (!emprestimo) {
      throw new NotFoundException('Emprestimo nao encontrado');
    }

    const hardware = await this.hardwareRepository.findById(
      emprestimo.hardwareId,
    );

    if (!hardware) {
      throw new NotFoundException('Hardware nao encontrado');
    }

    try {
      emprestimo.devolver();
    } catch (error) {
      if (error instanceof EmprestimoJaDevolvidoError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }

    hardware.devolver();

    await this.hardwareRepository.save(hardware);
    await this.emprestimoRepository.save(emprestimo);

    return emprestimo;
  }
}
