import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';
import { TenantModule } from '../../tenant/tenant.module';
import { TenantContext } from '../../tenant/tenant-context';
import { TenantSubscriber } from '../../tenant/tenant.subscriber';

@Module({
  imports: [TypeOrmModule.forRoot(AppDataSource.options), TenantModule],
  providers: [
    {
      provide: TenantSubscriber,
      inject: [DataSource, TenantContext],
      useFactory: (dataSource: DataSource, tenantContext: TenantContext) => {
        const existingSubscriber = dataSource.subscribers.find(
          (subscriber): subscriber is TenantSubscriber =>
            subscriber instanceof TenantSubscriber,
        );

        if (existingSubscriber) {
          return existingSubscriber;
        }

        const subscriber = new TenantSubscriber(tenantContext);
        dataSource.subscribers.push(subscriber);
        return subscriber;
      },
    },
  ],
})
export class DatabaseModule {}
