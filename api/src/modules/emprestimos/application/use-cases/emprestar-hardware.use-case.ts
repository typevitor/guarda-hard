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
import {
  IUsuarioRepository,
  USUARIO_REPOSITORY,
} from '../../../usuarios/domain/repositories/usuario.repository.interface';
import { Emprestimo } from '../../domain/entities/emprestimo.entity';
import { HardwareDefeituosoError } from '../../../hardwares/domain/errors/hardware-defeituoso.error';
import { HardwareNaoDisponivelError } from '../../../hardwares/domain/errors/hardware-nao-disponivel.error';

@Injectable()
export class EmprestarHardwareUseCase {
  constructor(
    @Inject(EMPRESTIMO_REPOSITORY)
    private readonly emprestimoRepository: IEmprestimoRepository,
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(input: {
    empresaId: string;
    usuarioId: string;
    hardwareId: string;
  }): Promise<Emprestimo> {
    const usuario = await this.usuarioRepository.findById(input.usuarioId);

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const hardware = await this.hardwareRepository.findById(input.hardwareId);

    if (!hardware) {
      throw new NotFoundException('Hardware nao encontrado');
    }

    try {
      hardware.emprestar();
    } catch (error) {
      if (
        error instanceof HardwareNaoDisponivelError ||
        error instanceof HardwareDefeituosoError
      ) {
        throw new ConflictException(error.message);
      }

      throw error;
    }

    const emprestimo = Emprestimo.emprestar({
      empresaId: input.empresaId,
      usuarioId: usuario.id,
      hardwareId: hardware.id,
    });

    await this.hardwareRepository.save(hardware);
    await this.emprestimoRepository.save(emprestimo);

    return emprestimo;
  }
}
