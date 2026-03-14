import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('empresas')
export class EmpresaOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  nome!: string;
}
