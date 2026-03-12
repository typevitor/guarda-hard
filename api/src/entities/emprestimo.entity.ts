import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Hardware } from './hardware.entity';

@Entity('emprestimos')
export class Emprestimo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  empresa_id!: string;

  @Column({ type: 'varchar', length: 36 })
  usuario_id!: string;

  @Column({ type: 'varchar', length: 36 })
  hardware_id!: string;

  @Column({ type: 'datetime' })
  data_retirada!: Date;

  @Column({ type: 'datetime', nullable: true })
  data_devolucao!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @ManyToOne(() => Hardware)
  @JoinColumn({ name: 'hardware_id' })
  hardware!: Hardware;
}
