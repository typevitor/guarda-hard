import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  HARDWARE_REPOSITORY,
  IHardwareRepository,
} from '../../domain/repositories/hardware.repository.interface';

@Injectable()
export class DeleteHardwareUseCase {
  constructor(
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const hardware = await this.hardwareRepository.findById(id);

    if (!hardware) {
      throw new NotFoundException('Hardware nao encontrado');
    }

    await this.hardwareRepository.delete(id);
  }
}
