import { Inject, Injectable } from '@nestjs/common';
import {
  HARDWARE_REPOSITORY,
  type HardwareOption,
  type IHardwareRepository,
} from '../../domain/repositories/hardware.repository.interface';

@Injectable()
export class ListHardwaresOptionsUseCase {
  constructor(
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(): Promise<HardwareOption[]> {
    return this.hardwareRepository.listOptions();
  }
}
