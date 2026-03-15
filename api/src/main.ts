import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiErrorFilter } from './shared/presentation/http/api-error.filter';
import { TenantContextInterceptor } from './shared/presentation/http/tenant-context.interceptor';
import { TenantContext } from './tenant/application/tenant-context';
import { DATABASE_STARTUP_MIGRATION_HANDLER } from './infrastructure/database/database.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  try {
    await app.resolve(DATABASE_STARTUP_MIGRATION_HANDLER);
  } catch (error) {
    await app.close();
    throw error;
  }

  const tenantContext = app.get(TenantContext);

  app.useGlobalInterceptors(new TenantContextInterceptor(tenantContext));
  app.useGlobalFilters(new ApiErrorFilter());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
