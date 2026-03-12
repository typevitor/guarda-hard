import { Module } from '@nestjs/common';
import { TenantContext } from './tenant-context';

@Module({
  providers: [TenantContext],
  exports: [TenantContext],
})
export class TenantModule {}
