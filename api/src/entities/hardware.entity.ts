import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import {
  DescricaoProblemaObrigatoriaError,
  HardwareDefeituosoError,
  HardwareNaoDisponivelError,
} from './domain.errors';

@Entity('hardwares')
export class Hardware {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  empresa_id!: string;

  @Column({ type: 'varchar', length: 200 })
  descricao!: string;

  @Column({ type: 'varchar', length: 100 })
  marca!: string;

  @Column({ type: 'varchar', length: 100 })
  modelo!: string;

  @Column({ type: 'varchar', length: 50 })
  codigo_patrimonio!: string;

  @Column({ type: 'boolean', default: true })
  funcionando!: boolean;

  @Column({ type: 'text', nullable: true })
  descricao_problema!: string | null;

  @Column({ type: 'boolean', default: true })
  livre!: boolean;

  @VersionColumn()
  version!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  emprestar(): void {
    if (!this.funcionando) {
      throw new HardwareDefeituosoError();
    }

    if (!this.livre) {
      throw new HardwareNaoDisponivelError();
    }

    this.livre = false;
  }

  devolver(): void {
    this.livre = true;
  }

  marcarDefeito(descricaoProblema: string): void {
    const descricao = descricaoProblema.trim();

    if (!descricao) {
      throw new DescricaoProblemaObrigatoriaError();
    }

    this.funcionando = false;
    this.livre = false;
    this.descricao_problema = descricao;
  }

  consertar(): void {
    this.funcionando = true;
    this.livre = true;
    this.descricao_problema = null;
  }
}
