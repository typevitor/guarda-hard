// api/src/modules/emprestimos/domain/repositories/emprestimo.repository.interface.ts
import { Emprestimo } from '../entities/emprestimo.entity';

export interface IEmprestimoRepository {
  findById(id: string): Promise<Emprestimo | null>;
  findAll(): Promise<Emprestimo[]>;
  save(emprestimo: Emprestimo): Promise<void>;
  delete(id: string): Promise<void>;
}

export const EMPRESTIMO_REPOSITORY = Symbol('IEmprestimoRepository');
