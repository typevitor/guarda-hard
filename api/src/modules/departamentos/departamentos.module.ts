import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartamentoOrmEntity } from './infrastructure/persistence/departamento.orm-entity';
import { TypeOrmDepartamentoRepository } from './infrastructure/persistence/departamento.typeorm-repository';
import { DEPARTAMENTO_REPOSITORY } from './domain/repositories/departamento.repository.interface';
import { CreateDepartamentoUseCase } from './application/use-cases/create-departamento.use-case';
import { ListDepartamentosUseCase } from './application/use-cases/list-departamentos.use-case';
import { GetDepartamentoByIdUseCase } from './application/use-cases/get-departamento-by-id.use-case';
import { UpdateDepartamentoUseCase } from './application/use-cases/update-departamento.use-case';
import { DeleteDepartamentoUseCase } from './application/use-cases/delete-departamento.use-case';
import { DepartamentosService } from './application/services/departamentos.service';
import { DepartamentosController } from './presentation/http/departamentos.controller';
import { TenantModule } from '../../tenant/tenant.module';

@Module({
  imports: [TypeOrmModule.forFeature([DepartamentoOrmEntity]), TenantModule],
  controllers: [DepartamentosController],
  providers: [
    {
      provide: DEPARTAMENTO_REPOSITORY,
      useClass: TypeOrmDepartamentoRepository,
    },
    CreateDepartamentoUseCase,
    ListDepartamentosUseCase,
    GetDepartamentoByIdUseCase,
    UpdateDepartamentoUseCase,
    DeleteDepartamentoUseCase,
    DepartamentosService,
  ],
  exports: [DEPARTAMENTO_REPOSITORY, DepartamentosService],
})
export class DepartamentosModule {}
