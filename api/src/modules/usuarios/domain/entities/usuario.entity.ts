import { DomainEntity } from '../../../../shared/domain/domain-entity.base';
import { randomUUID } from 'node:crypto';

export interface UsuarioProps {
  id: string;
  empresaId: string;
  departamentoId: string;
  nome: string;
  email: string;
  senhaHash?: string;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Usuario extends DomainEntity {
  readonly departamentoId: string;
  private _nome: string;
  private _email: string;
  private _senhaHash: string;
  private _ativo: boolean;

  constructor(props: UsuarioProps) {
    super(props);
    this.departamentoId = props.departamentoId;
    this._nome = props.nome;
    this._email = props.email;
    this._senhaHash = props.senhaHash ?? '';
    this._ativo = props.ativo;
  }

  static create(props: {
    empresaId: string;
    departamentoId: string;
    nome: string;
    email: string;
    senhaHash?: string;
  }): Usuario {
    return new Usuario({
      id: randomUUID(),
      empresaId: props.empresaId,
      departamentoId: props.departamentoId,
      nome: props.nome,
      email: props.email,
      senhaHash: props.senhaHash,
      ativo: true,
    });
  }

  get nome(): string {
    return this._nome;
  }
  get email(): string {
    return this._email;
  }
  get senhaHash(): string {
    return this._senhaHash;
  }
  get ativo(): boolean {
    return this._ativo;
  }

  atualizarPerfil(props: {
    nome?: string;
    email?: string;
    senhaHash?: string;
    ativo?: boolean;
  }): void {
    if (props.nome !== undefined) {
      this._nome = props.nome;
    }

    if (props.email !== undefined) {
      this._email = props.email;
    }

    if (props.senhaHash !== undefined) {
      this._senhaHash = props.senhaHash;
    }

    if (props.ativo !== undefined) {
      this._ativo = props.ativo;
    }
  }
}
