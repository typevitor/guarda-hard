import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ApiErrorFilter } from './shared/presentation/http/api-error.filter';
import { TenantContextInterceptor } from './shared/presentation/http/tenant-context.interceptor';
import { TenantContext } from './tenant/application/tenant-context';
import { DATABASE_STARTUP_MIGRATION_HANDLER } from './infrastructure/database/database.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  app.use(helmet());
  app.enableCors(
    process.env.CORS_ORIGIN
      ? { origin: process.env.CORS_ORIGIN, credentials: true }
      : { origin: false },
  );

  try {
    await app.resolve(DATABASE_STARTUP_MIGRATION_HANDLER);
  } catch (error) {
    logger.error('Failed to run startup migrations, shutting down', error);
    await app.close();
    throw error;
  }

  const tenantContext = app.get(TenantContext);

  app.useGlobalInterceptors(new TenantContextInterceptor(tenantContext));
  app.useGlobalFilters(new ApiErrorFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
void bootstrap();
