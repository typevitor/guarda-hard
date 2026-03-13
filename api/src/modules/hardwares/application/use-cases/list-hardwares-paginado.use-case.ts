import { Inject, Injectable } from '@nestjs/common';
import {
  HARDWARE_REPOSITORY,
  type HardwareListQuery,
  type IHardwareRepository,
  type PaginatedHardwares,
} from '../../domain/repositories/hardware.repository.interface';

@Injectable()
export class ListHardwaresPaginadoUseCase {
  constructor(
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(query: HardwareListQuery): Promise<PaginatedHardwares> {
    return this.hardwareRepository.listPaginated(query);
  }
}
