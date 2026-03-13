import { Inject, Injectable } from '@nestjs/common';
import { Hardware } from '../../domain/entities/hardware.entity';
import {
  HARDWARE_REPOSITORY,
  IHardwareRepository,
} from '../../domain/repositories/hardware.repository.interface';

@Injectable()
export class ListHardwaresUseCase {
  constructor(
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(): Promise<Hardware[]> {
    return this.hardwareRepository.findAll();
  }
}
