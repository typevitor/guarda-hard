export abstract class DomainEntity {
  readonly id: string;
  readonly empresaId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  protected constructor(props: {
    id: string;
    empresaId: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.empresaId = props.empresaId;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }
}
