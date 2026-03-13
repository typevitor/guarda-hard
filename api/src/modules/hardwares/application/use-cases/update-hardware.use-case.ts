import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Hardware } from '../../domain/entities/hardware.entity';
import {
  HARDWARE_REPOSITORY,
  IHardwareRepository,
} from '../../domain/repositories/hardware.repository.interface';

@Injectable()
export class UpdateHardwareUseCase {
  constructor(
    @Inject(HARDWARE_REPOSITORY)
    private readonly hardwareRepository: IHardwareRepository,
  ) {}

  async execute(input: {
    id: string;
    descricao?: string;
    marca?: string;
    modelo?: string;
    codigoPatrimonio?: string;
  }): Promise<Hardware> {
    const hardware = await this.hardwareRepository.findById(input.id);

    if (!hardware) {
      throw new NotFoundException('Hardware nao encontrado');
    }

    hardware.atualizarCadastro({
      descricao: input.descricao,
      marca: input.marca,
      modelo: input.modelo,
      codigoPatrimonio: input.codigoPatrimonio,
    });

    await this.hardwareRepository.save(hardware);

    return hardware;
  }
}
