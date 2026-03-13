// api/src/modules/hardwares/domain/repositories/hardware.repository.interface.ts
import { Hardware } from '../entities/hardware.entity';

export interface IHardwareRepository {
  findById(id: string): Promise<Hardware | null>;
  findAll(): Promise<Hardware[]>;
  save(hardware: Hardware): Promise<void>;
  delete(id: string): Promise<void>;
}

export const HARDWARE_REPOSITORY = Symbol('IHardwareRepository');
