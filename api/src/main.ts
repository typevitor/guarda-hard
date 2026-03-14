import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiErrorFilter } from './shared/presentation/http/api-error.filter';
import { TenantContextInterceptor } from './shared/presentation/http/tenant-context.interceptor';
import { TenantContext } from './tenant/application/tenant-context';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const tenantContext = app.get(TenantContext);

  app.useGlobalInterceptors(new TenantContextInterceptor(tenantContext));
  app.useGlobalFilters(new ApiErrorFilter());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
