import { DomainEntity } from '../../../../shared/domain/domain-entity.base';
import { randomUUID } from 'node:crypto';

export interface DepartamentoProps {
  id: string;
  empresaId: string;
  nome: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Departamento extends DomainEntity {
  private _nome: string;

  constructor(props: DepartamentoProps) {
    super(props);
    this._nome = props.nome;
  }

  static create(props: { empresaId: string; nome: string }): Departamento {
    return new Departamento({
      id: randomUUID(),
      empresaId: props.empresaId,
      nome: props.nome,
    });
  }

  get nome(): string {
    return this._nome;
  }

  renomear(nome: string): void {
    this._nome = nome;
  }
}
