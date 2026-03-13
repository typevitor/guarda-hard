import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  HARDWARE_REPOSITORY,
  IHardwareRepository,
} from '../../domain/repositories/hardware.repository.interface';
import { Hardware } from '../../domain/entities/hardware.entity';

@Injectable()
export class MarcarDefeitoUseCase {
  constructor(
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(input: {
    id: string;
    descricaoProblema: string;
  }): Promise<Hardware> {
    const hardware = await this.hardwareRepository.findById(input.id);

    if (!hardware) {
      throw new NotFoundException('Hardware nao encontrado');
    }

    hardware.marcarDefeito(input.descricaoProblema);
    await this.hardwareRepository.save(hardware);

    return hardware;
  }
}
