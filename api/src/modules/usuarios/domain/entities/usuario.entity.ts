import { DomainEntity } from '../../../../shared/domain/domain-entity.base';
import { randomUUID } from 'node:crypto';

export interface UsuarioProps {
  id: string;
  empresaId: string;
  departamentoId: string;
  nome: string;
  email: string;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Usuario extends DomainEntity {
  readonly departamentoId: string; // Cross-aggregate reference by ID
  private _nome: string;
  private _email: string;
  private _ativo: boolean;

  constructor(props: UsuarioProps) {
    super(props);
    this.departamentoId = props.departamentoId;
    this._nome = props.nome;
    this._email = props.email;
    this._ativo = props.ativo;
  }

  static create(props: {
    empresaId: string;
    departamentoId: string;
    nome: string;
    email: string;
  }): Usuario {
    return new Usuario({
      id: randomUUID(),
      empresaId: props.empresaId,
      departamentoId: props.departamentoId,
      nome: props.nome,
      email: props.email,
      ativo: true,
    });
  }

  get nome(): string {
    return this._nome;
  }
  get email(): string {
    return this._email;
  }
  get ativo(): boolean {
    return this._ativo;
  }
}
