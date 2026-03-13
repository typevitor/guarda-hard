import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HardwareOrmEntity } from './infrastructure/persistence/hardware.orm-entity';
import { TypeOrmHardwareRepository } from './infrastructure/persistence/hardware.typeorm-repository';
import { HARDWARE_REPOSITORY } from './domain/repositories/hardware.repository.interface';
import { CreateHardwareUseCase } from './application/use-cases/create-hardware.use-case';
import { ListHardwaresUseCase } from './application/use-cases/list-hardwares.use-case';
import { ListHardwaresPaginadoUseCase } from './application/use-cases/list-hardwares-paginado.use-case';
import { GetHardwareByIdUseCase } from './application/use-cases/get-hardware-by-id.use-case';
import { UpdateHardwareUseCase } from './application/use-cases/update-hardware.use-case';
import { DeleteHardwareUseCase } from './application/use-cases/delete-hardware.use-case';
import { MarcarDefeitoUseCase } from './application/use-cases/marcar-defeito.use-case';
import { ConsertarHardwareUseCase } from './application/use-cases/consertar-hardware.use-case';
import { HardwaresService } from './application/services/hardwares.service';
import { HardwaresController } from './presentation/http/hardwares.controller';
import { TenantModule } from '../../tenant/tenant.module';

@Module({
  imports: [TypeOrmModule.forFeature([HardwareOrmEntity]), TenantModule],
  controllers: [HardwaresController],
  providers: [
    {
      provide: HARDWARE_REPOSITORY,
      useClass: TypeOrmHardwareRepository,
    },
    CreateHardwareUseCase,
    ListHardwaresUseCase,
    ListHardwaresPaginadoUseCase,
    GetHardwareByIdUseCase,
    UpdateHardwareUseCase,
    DeleteHardwareUseCase,
    MarcarDefeitoUseCase,
    ConsertarHardwareUseCase,
    HardwaresService,
  ],
  exports: [HARDWARE_REPOSITORY, HardwaresService],
})
export class HardwaresModule {}
