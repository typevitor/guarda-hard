// api/src/modules/departamentos/domain/repositories/departamento.repository.interface.ts
import { Departamento } from '../entities/departamento.entity';

export type DepartamentoListQuery = {
  page: number;
  pageSize: 10;
  search?: string;
};

export type PaginatedDepartamentos = {
  items: Departamento[];
  page: number;
  pageSize: 10;
  total: number;
  totalPages: number;
};

export type DepartamentoOption = {
  id: string;
  nome: string;
};

export interface IDepartamentoRepository {
  findById(id: string): Promise<Departamento | null>;
  findAll(): Promise<Departamento[]>;
  listPaginated(query: DepartamentoListQuery): Promise<PaginatedDepartamentos>;
  listOptions(): Promise<DepartamentoOption[]>;
  save(departamento: Departamento): Promise<void>;
  delete(id: string): Promise<void>;
}

export const DEPARTAMENTO_REPOSITORY = Symbol('IDepartamentoRepository');
