import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  HARDWARE_REPOSITORY,
  IHardwareRepository,
} from '../../domain/repositories/hardware.repository.interface';
import { Hardware } from '../../domain/entities/hardware.entity';

@Injectable()
export class ConsertarHardwareUseCase {
  constructor(
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(input: { id: string }): Promise<Hardware> {
    const hardware = await this.hardwareRepository.findById(input.id);

    if (!hardware) {
      throw new NotFoundException('Hardware nao encontrado');
    }

    hardware.consertar();
    await this.hardwareRepository.save(hardware);

    return hardware;
  }
}
