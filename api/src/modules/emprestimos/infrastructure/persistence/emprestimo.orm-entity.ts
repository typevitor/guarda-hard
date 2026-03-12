import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UsuarioOrmEntity } from '../../../usuarios/infrastructure/persistence/usuario.orm-entity';
import { HardwareOrmEntity } from '../../../hardwares/infrastructure/persistence/hardware.orm-entity';

@Entity('emprestimos')
export class EmprestimoOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ type: 'varchar', name: 'empresa_id', length: 36 })
  empresa_id!: string;

  @Column({ type: 'varchar', name: 'usuario_id', length: 36 })
  usuario_id!: string;

  @Column({ type: 'varchar', name: 'hardware_id', length: 36 })
  hardware_id!: string;

  @Column({ type: 'datetime', name: 'data_retirada' })
  data_retirada!: Date;

  @Column({ type: 'datetime', name: 'data_devolucao', nullable: true })
  data_devolucao!: Date | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at!: Date;

  @ManyToOne(() => UsuarioOrmEntity)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: UsuarioOrmEntity;

  @ManyToOne(() => HardwareOrmEntity)
  @JoinColumn({ name: 'hardware_id' })
  hardware!: HardwareOrmEntity;
}
