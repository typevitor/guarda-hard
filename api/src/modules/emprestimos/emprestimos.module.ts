import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmprestimoOrmEntity } from './infrastructure/persistence/emprestimo.orm-entity';
import { TypeOrmEmprestimoRepository } from './infrastructure/persistence/emprestimo.typeorm-repository';
import { EMPRESTIMO_REPOSITORY } from './domain/repositories/emprestimo.repository.interface';
import { EmprestarHardwareUseCase } from './application/use-cases/emprestar-hardware.use-case';
import { DevolverHardwareUseCase } from './application/use-cases/devolver-hardware.use-case';
import { EmprestimosService } from './application/services/emprestimos.service';
import { EmprestimosController } from './presentation/http/emprestimos.controller';
import { HardwaresModule } from '../hardwares/hardwares.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { TenantModule } from '../../tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmprestimoOrmEntity]),
    HardwaresModule,
    UsuariosModule,
    TenantModule,
  ],
  controllers: [EmprestimosController],
  providers: [
    {
      provide: EMPRESTIMO_REPOSITORY,
      useClass: TypeOrmEmprestimoRepository,
    },
    EmprestarHardwareUseCase,
    DevolverHardwareUseCase,
    EmprestimosService,
  ],
  exports: [EMPRESTIMO_REPOSITORY, EmprestimosService],
})
export class EmprestimosModule {}
