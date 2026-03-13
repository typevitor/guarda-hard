// api/src/modules/emprestimos/domain/repositories/emprestimo.repository.interface.ts
import { Emprestimo } from '../entities/emprestimo.entity';

export type EmprestimoListQuery = {
  page: number;
  pageSize: 10;
  search?: string;
  usuarioId?: string;
  hardwareId?: string;
  retiradaFrom?: string;
  retiradaTo?: string;
  devolucaoFrom?: string;
  devolucaoTo?: string;
  status?: 'open' | 'returned';
};

export type PaginatedEmprestimos = {
  items: Emprestimo[];
  page: number;
  pageSize: 10;
  total: number;
  totalPages: number;
};

export interface IEmprestimoRepository {
  findById(id: string): Promise<Emprestimo | null>;
  findAll(): Promise<Emprestimo[]>;
  listPaginated(query: EmprestimoListQuery): Promise<PaginatedEmprestimos>;
  save(emprestimo: Emprestimo): Promise<void>;
  delete(id: string): Promise<void>;
}

export const EMPRESTIMO_REPOSITORY = Symbol('IEmprestimoRepository');
