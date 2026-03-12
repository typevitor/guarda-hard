import {
  Entity,
  PrimaryColumn,
  Column,
  VersionColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hardwares')
export class HardwareOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ type: 'varchar', name: 'empresa_id', length: 36 })
  empresa_id!: string;

  @Column({ type: 'varchar', length: 200 })
  descricao!: string;

  @Column({ type: 'varchar', length: 100 })
  marca!: string;

  @Column({ type: 'varchar', length: 100 })
  modelo!: string;

  @Column({ type: 'varchar', name: 'codigo_patrimonio', length: 50 })
  codigo_patrimonio!: string;

  @Column({ type: 'boolean', default: true })
  funcionando!: boolean;

  @Column({ type: 'text', name: 'descricao_problema', nullable: true })
  descricao_problema!: string | null;

  @Column({ type: 'boolean', default: true })
  livre!: boolean;

  @VersionColumn()
  version!: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at!: Date;
}
