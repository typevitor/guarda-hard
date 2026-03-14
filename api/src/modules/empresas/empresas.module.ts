import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListEmpresasUseCase } from './application/use-cases/list-empresas.use-case';
import { EmpresasService } from './application/services/empresas.service';
import { EMPRESA_REPOSITORY } from './domain/repositories/empresa.repository.interface';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa.orm-entity';
import { TypeOrmEmpresaRepository } from './infrastructure/persistence/empresa.typeorm-repository';

@Module({
  imports: [TypeOrmModule.forFeature([EmpresaOrmEntity])],
  providers: [
    {
      provide: EMPRESA_REPOSITORY,
      useClass: TypeOrmEmpresaRepository,
    },
    ListEmpresasUseCase,
    EmpresasService,
  ],
  exports: [EMPRESA_REPOSITORY, ListEmpresasUseCase, EmpresasService],
})
export class EmpresasModule {}
