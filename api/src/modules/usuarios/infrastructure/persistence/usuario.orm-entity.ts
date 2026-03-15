import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('usuarios')
export class UsuarioOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nome!: string;

  @Column({ type: 'varchar', length: 200 })
  email!: string;

  @Column({ type: 'varchar', name: 'senha_hash', length: 255 })
  senha_hash!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at!: Date;
}
