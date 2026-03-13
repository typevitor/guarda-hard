import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HardwareOrmEntity } from './infrastructure/persistence/hardware.orm-entity';
import { TypeOrmHardwareRepository } from './infrastructure/persistence/hardware.typeorm-repository';
import { HARDWARE_REPOSITORY } from './domain/repositories/hardware.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([HardwareOrmEntity])],
  providers: [
    {
      provide: HARDWARE_REPOSITORY,
      useClass: TypeOrmHardwareRepository,
    },
  ],
  exports: [HARDWARE_REPOSITORY],
})
export class HardwaresModule {}
