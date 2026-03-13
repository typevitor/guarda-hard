import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartamentoOrmEntity } from './infrastructure/persistence/departamento.orm-entity';
import { TypeOrmDepartamentoRepository } from './infrastructure/persistence/departamento.typeorm-repository';
import { DEPARTAMENTO_REPOSITORY } from './domain/repositories/departamento.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([DepartamentoOrmEntity])],
  providers: [
    {
      provide: DEPARTAMENTO_REPOSITORY,
      useClass: TypeOrmDepartamentoRepository,
    },
  ],
  exports: [DEPARTAMENTO_REPOSITORY],
})
export class DepartamentosModule {}
