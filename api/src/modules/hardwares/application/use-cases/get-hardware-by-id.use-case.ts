import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Hardware } from '../../domain/entities/hardware.entity';
import {
  HARDWARE_REPOSITORY,
  IHardwareRepository,
} from '../../domain/repositories/hardware.repository.interface';

@Injectable()
export class GetHardwareByIdUseCase {
  constructor(
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(id: string): Promise<Hardware> {
    const hardware = await this.hardwareRepository.findById(id);

    if (!hardware) {
      throw new NotFoundException('Hardware nao encontrado');
    }

    return hardware;
  }
}
