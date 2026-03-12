import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { TenantModule } from './tenant';

@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
