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
import { EmprestimoJaDevolvidoError } from './domain.errors';

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

  static emprestar(input: {
    empresa_id: string;
    usuario_id: string;
    hardware_id: string;
    hardware: Hardware;
    data_retirada?: Date;
  }): Emprestimo {
    input.hardware.emprestar();

    return Object.assign(new Emprestimo(), {
      empresa_id: input.empresa_id,
      usuario_id: input.usuario_id,
      hardware_id: input.hardware_id,
      data_retirada: input.data_retirada ?? new Date(),
      data_devolucao: null,
    });
  }

  devolver(hardware: Hardware, dataDevolucao: Date = new Date()): void {
    if (this.data_devolucao) {
      throw new EmprestimoJaDevolvidoError();
    }

    this.data_devolucao = dataDevolucao;
    hardware.devolver();
  }
}
