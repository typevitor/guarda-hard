import { Empresa } from '../entities/empresa.entity';

export interface IEmpresaRepository {
  findAll(): Promise<Empresa[]>;
}

export const EMPRESA_REPOSITORY = Symbol('IEmpresaRepository');
