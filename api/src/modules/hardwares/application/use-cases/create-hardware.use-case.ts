import { Inject, Injectable } from '@nestjs/common';
import { Hardware } from '../../domain/entities/hardware.entity';
import {
  HARDWARE_REPOSITORY,
  IHardwareRepository,
} from '../../domain/repositories/hardware.repository.interface';

@Injectable()
export class CreateHardwareUseCase {
  constructor(
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(input: {
    empresaId: string;
    descricao: string;
    marca: string;
    modelo: string;
    codigoPatrimonio: string;
  }): Promise<Hardware> {
    const hardware = Hardware.create({
      empresaId: input.empresaId,
      descricao: input.descricao,
      marca: input.marca,
      modelo: input.modelo,
      codigoPatrimonio: input.codigoPatrimonio,
    });

    await this.hardwareRepository.save(hardware);

    return hardware;
  }
}
