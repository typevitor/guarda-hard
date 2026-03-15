import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';
import { TenantModule } from '../../tenant/tenant.module';
import { TenantContext } from '../../tenant/application/tenant-context';
import { TenantSubscriber } from '../../tenant/infrastructure/tenant.subscriber';

export const DATABASE_STARTUP_MIGRATION_HANDLER =
  'DATABASE_STARTUP_MIGRATION_HANDLER';

const logger = new Logger('DatabaseModule');

async function ensureUsuarioEmpresasDepartamentoColumn(
  dataSource: DataSource,
): Promise<void> {
  const sqliteTables = (await dataSource.query(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'usuario_empresas'`,
  )) as Array<{ name: string }>;

  if (sqliteTables.length === 0) {
    return;
  }

  const columns = (await dataSource.query(
    `PRAGMA table_info('usuario_empresas')`,
  )) as Array<{ name: string }>;

  if (columns.some((column) => column.name === 'departamento_id')) {
    return;
  }

  logger.warn(
    'Detected drifted usuario_empresas schema without departamento_id; applying compatibility patch',
  );

  await dataSource.query(
    `ALTER TABLE usuario_empresas ADD COLUMN departamento_id varchar(36)`,
  );

  await dataSource.query(`
    UPDATE usuario_empresas
    SET departamento_id = (
      SELECT d.id
      FROM departamentos d
      WHERE d.empresa_id = usuario_empresas.empresa_id
      ORDER BY d.created_at ASC
      LIMIT 1
    )
    WHERE departamento_id IS NULL
  `);
}

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
    {
      provide: DATABASE_STARTUP_MIGRATION_HANDLER,
      inject: [DataSource],
      useFactory: async (dataSource: DataSource) => {
        if (process.env.SKIP_STARTUP_MIGRATIONS === 'true') {
          logger.log(
            'Skipping startup migrations due to SKIP_STARTUP_MIGRATIONS=true',
          );
          return true;
        }

        const hasPendingMigrations = await dataSource.showMigrations();

        if (!hasPendingMigrations) {
          await ensureUsuarioEmpresasDepartamentoColumn(dataSource);
          return true;
        }

        logger.log(
          'Running pending database migrations before serving requests',
        );
        await dataSource.runMigrations({ transaction: 'none' });
        await ensureUsuarioEmpresasDepartamentoColumn(dataSource);
        logger.log('Startup database migrations completed');
        return true;
      },
    },
  ],
})
export class DatabaseModule {}
