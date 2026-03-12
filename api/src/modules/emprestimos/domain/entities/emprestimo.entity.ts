import { DomainEntity } from '../../../../shared/domain/domain-entity.base';
import { EmprestimoJaDevolvidoError } from '../errors/emprestimo-ja-devolvido.error';
import { randomUUID } from 'node:crypto';

export interface EmprestimoProps {
  id: string;
  empresaId: string;
  usuarioId: string;
  hardwareId: string;
  dataRetirada: Date;
  dataDevolucao: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Emprestimo extends DomainEntity {
  readonly usuarioId: string;
  readonly hardwareId: string;
  private _dataRetirada: Date;
  private _dataDevolucao: Date | null;

  constructor(props: EmprestimoProps) {
    super(props);
    this.usuarioId = props.usuarioId;
    this.hardwareId = props.hardwareId;
    this._dataRetirada = props.dataRetirada;
    this._dataDevolucao = props.dataDevolucao;
  }

  static emprestar(props: {
    empresaId: string;
    usuarioId: string;
    hardwareId: string;
    dataRetirada?: Date;
  }): Emprestimo {
    return new Emprestimo({
      id: randomUUID(),
      empresaId: props.empresaId,
      usuarioId: props.usuarioId,
      hardwareId: props.hardwareId,
      dataRetirada: props.dataRetirada ?? new Date(),
      dataDevolucao: null,
    });
  }

  devolver(dataDevolucao?: Date): void {
    if (this._dataDevolucao) throw new EmprestimoJaDevolvidoError();
    this._dataDevolucao = dataDevolucao ?? new Date();
  }

  get estaDevolvido(): boolean {
    return this._dataDevolucao !== null;
  }
  get dataRetirada(): Date {
    return this._dataRetirada;
  }
  get dataDevolucao(): Date | null {
    return this._dataDevolucao;
  }
}
