// api/src/modules/hardwares/domain/repositories/hardware.repository.interface.ts
import { Hardware } from '../entities/hardware.entity';

export type HardwareListQuery = {
  page: number;
  pageSize: 10;
  search?: string;
  funcionando?: boolean;
  livre?: boolean;
};

export type PaginatedHardwares = {
  items: Hardware[];
  page: number;
  pageSize: 10;
  total: number;
  totalPages: number;
};

export interface IHardwareRepository {
  findById(id: string): Promise<Hardware | null>;
  findAll(): Promise<Hardware[]>;
  listPaginated(query: HardwareListQuery): Promise<PaginatedHardwares>;
  save(hardware: Hardware): Promise<void>;
  delete(id: string): Promise<void>;
}

export const HARDWARE_REPOSITORY = Symbol('IHardwareRepository');
