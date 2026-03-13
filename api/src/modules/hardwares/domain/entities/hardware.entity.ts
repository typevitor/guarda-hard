import { DomainEntity } from '../../../../shared/domain/domain-entity.base';
import { HardwareNaoDisponivelError } from '../errors/hardware-nao-disponivel.error';
import { HardwareDefeituosoError } from '../errors/hardware-defeituoso.error';
import { DescricaoProblemaObrigatoriaError } from '../errors/descricao-problema-obrigatoria.error';
import { randomUUID } from 'node:crypto';

export interface HardwareProps {
  id: string;
  empresaId: string;
  descricao: string;
  marca: string;
  modelo: string;
  codigoPatrimonio: string;
  funcionando: boolean;
  descricaoProblema: string | null;
  livre: boolean;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateHardwareProps {
  empresaId: string;
  descricao: string;
  marca: string;
  modelo: string;
  codigoPatrimonio: string;
}

export class Hardware extends DomainEntity {
  private _descricao: string;
  private _marca: string;
  private _modelo: string;
  private _codigoPatrimonio: string;
  private _funcionando: boolean;
  private _descricaoProblema: string | null;
  private _livre: boolean;
  readonly version: number;

  // Used by mapper to reconstitute from DB
  constructor(props: HardwareProps) {
    super(props);
    this._descricao = props.descricao;
    this._marca = props.marca;
    this._modelo = props.modelo;
    this._codigoPatrimonio = props.codigoPatrimonio;
    this._funcionando = props.funcionando;
    this._descricaoProblema = props.descricaoProblema;
    this._livre = props.livre;
    this.version = props.version;
  }

  // Factory for creating new hardware — generates UUID
  static create(props: CreateHardwareProps): Hardware {
    return new Hardware({
      id: randomUUID(),
      empresaId: props.empresaId,
      descricao: props.descricao,
      marca: props.marca,
      modelo: props.modelo,
      codigoPatrimonio: props.codigoPatrimonio,
      funcionando: true,
      descricaoProblema: null,
      livre: true,
      version: 0,
    });
  }

  // Domain methods — logic preserved from current entity
  emprestar(): void {
    if (!this._funcionando) throw new HardwareDefeituosoError();
    if (!this._livre) throw new HardwareNaoDisponivelError();
    this._livre = false;
  }

  devolver(): void {
    this._livre = true;
  }

  marcarDefeito(descricaoProblema: string): void {
    const descricao = descricaoProblema.trim();
    if (!descricao) throw new DescricaoProblemaObrigatoriaError();
    this._funcionando = false;
    this._livre = false;
    this._descricaoProblema = descricao;
  }

  consertar(): void {
    this._funcionando = true;
    this._livre = true;
    this._descricaoProblema = null;
  }

  // Getters
  get descricao(): string {
    return this._descricao;
  }
  get marca(): string {
    return this._marca;
  }
  get modelo(): string {
    return this._modelo;
  }
  get codigoPatrimonio(): string {
    return this._codigoPatrimonio;
  }
  get funcionando(): boolean {
    return this._funcionando;
  }
  get descricaoProblema(): string | null {
    return this._descricaoProblema;
  }
  get livre(): boolean {
    return this._livre;
  }

  atualizarCadastro(props: {
    descricao?: string;
    marca?: string;
    modelo?: string;
    codigoPatrimonio?: string;
  }): void {
    if (props.descricao !== undefined) {
      this._descricao = props.descricao;
    }

    if (props.marca !== undefined) {
      this._marca = props.marca;
    }

    if (props.modelo !== undefined) {
      this._modelo = props.modelo;
    }

    if (props.codigoPatrimonio !== undefined) {
      this._codigoPatrimonio = props.codigoPatrimonio;
    }
  }
}
