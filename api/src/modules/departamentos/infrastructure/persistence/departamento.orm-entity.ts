import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('departamentos')
export class DepartamentoOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ type: 'varchar', name: 'empresa_id', length: 36 })
  empresa_id!: string;

  @Column({ type: 'varchar', length: 100 })
  nome!: string;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at!: Date;
}
