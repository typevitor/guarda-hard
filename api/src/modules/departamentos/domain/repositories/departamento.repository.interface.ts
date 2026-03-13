// api/src/modules/departamentos/domain/repositories/departamento.repository.interface.ts
import { Departamento } from '../entities/departamento.entity';

export interface IDepartamentoRepository {
  findById(id: string): Promise<Departamento | null>;
  findAll(): Promise<Departamento[]>;
  save(departamento: Departamento): Promise<void>;
  delete(id: string): Promise<void>;
}

export const DEPARTAMENTO_REPOSITORY = Symbol('IDepartamentoRepository');
