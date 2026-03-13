import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmprestimoOrmEntity } from './infrastructure/persistence/emprestimo.orm-entity';
import { TypeOrmEmprestimoRepository } from './infrastructure/persistence/emprestimo.typeorm-repository';
import { EMPRESTIMO_REPOSITORY } from './domain/repositories/emprestimo.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([EmprestimoOrmEntity])],
  providers: [
    {
      provide: EMPRESTIMO_REPOSITORY,
      useClass: TypeOrmEmprestimoRepository,
    },
  ],
  exports: [EMPRESTIMO_REPOSITORY],
})
export class EmprestimosModule {}
